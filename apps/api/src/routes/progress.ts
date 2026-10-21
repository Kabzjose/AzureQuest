import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getDomainSummaries, getMisconceptionsForUser } from '../repositories/progressRepository';
import { computeReadiness } from '../services/readinessService';
import { findPublishedScenarios } from '../repositories/scenarioRepository';
import { getDueFlashcards } from '../repositories/attemptRepository';
import { db } from '../db/client';
import { attempts } from '../db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { concepts } from '../db/schema';
import type { NextActivity } from '@azurequest/shared';

export const progressRouter = Router();
progressRouter.use(requireAuth);

// GET /api/progress/domains
progressRouter.get('/domains', async (req, res, next) => {
  try {
    const summaries = await getDomainSummaries(req.user!.id);
    const readiness = computeReadiness(summaries);
    res.json({ domains: readiness.domains });
  } catch (err) {
    next(err);
  }
});

// GET /api/progress/readiness
progressRouter.get('/readiness', async (req, res, next) => {
  try {
    const summaries = await getDomainSummaries(req.user!.id);
    const readiness = computeReadiness(summaries);
    res.json({ readiness });
  } catch (err) {
    next(err);
  }
});

// GET /api/progress/misconceptions
progressRouter.get('/misconceptions', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const stats = await getMisconceptionsForUser(userId);

    // Enrich with concept names
    const allConceptIds = new Set<string>();
    for (const s of stats) {
      const [a, b] = s.conceptPair.split('|');
      allConceptIds.add(a);
      allConceptIds.add(b);
    }

    const conceptRows = allConceptIds.size > 0
      ? await db.select({ id: concepts.id, name: concepts.name })
          .from(concepts)
          .where(
            // simple in-clause
            require('drizzle-orm').inArray(concepts.id, [...allConceptIds]),
          )
      : [];

    const nameMap = new Map(conceptRows.map((c) => [c.id, c.name]));

    const enriched = stats.map((s) => {
      const [a, b] = s.conceptPair.split('|');
      return {
        conceptPair: s.conceptPair,
        conceptNameA: nameMap.get(a) ?? a,
        conceptNameB: nameMap.get(b) ?? b,
        count: s.count,
        lastSeenAt: s.lastSeenAt.toISOString(),
      };
    });

    res.json({ misconceptions: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/progress/next — recommended next activity
progressRouter.get('/next', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Get readiness to find weakest domain
    const summaries = await getDomainSummaries(userId);
    const readiness = computeReadiness(summaries);

    // Find weakest domain (lowest score, or null = not started)
    const weakestDomain = readiness.domains.reduce((weakest, d) => {
      if (weakest === null) return d;
      const ws = weakest.score ?? -1;
      const ds = d.score ?? -1;
      return ds < ws ? d : weakest;
    }, null as typeof readiness.domains[0] | null);

    // Get completed scenario IDs for this user
    const completedRows = await db
      .select({ scenarioId: attempts.scenarioId })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), isNotNull(attempts.completedAt)));
    const completedScenarioIds = new Set(completedRows.map((r) => r.scenarioId));

    // Due flashcards count
    const dueCards = await getDueFlashcards(userId);

    let next: NextActivity | null = null;

    // 1. Unvisited scenario in weakest domain
    if (weakestDomain) {
      const allScenarios = await findPublishedScenarios({ domain: weakestDomain.domain });
      const unvisited = allScenarios.find((s) => !completedScenarioIds.has(s.id));
      if (unvisited) {
        next = {
          type: 'scenario',
          label: `Try: ${unvisited.title}`,
          scenarioId: unvisited.id,
          domain: weakestDomain.domain,
        };
      }
    }

    // 2. Due flashcards
    if (!next && dueCards.length > 0) {
      next = {
        type: 'flashcard',
        label: `Review ${dueCards.length} due flashcard${dueCards.length === 1 ? '' : 's'}`,
      };
    }

    // 3. AI practice on top misconception
    if (!next) {
      const misconceptions = await getMisconceptionsForUser(userId);
      const topMisconception = misconceptions.find((m) => m.count >= 2);
      if (topMisconception) {
        next = {
          type: 'practice',
          label: 'AI practice: address your top misconception',
          misconceptionPair: topMisconception.conceptPair,
        };
      }
    }

    res.json({ next });
  } catch (err) {
    next(err);
  }
});
