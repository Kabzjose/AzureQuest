import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import { ExplainBodySchema, ChatBodySchema, PracticeBodySchema, TutorExplanationSchema } from '@azurequest/shared';
import { llmClient } from '../llm/client';
import { buildExplainSystemPrompt, buildChatSystemPrompt, buildPracticeSystemPrompt } from '../llm/prompts';
import { findDecisionById, findScenarioById, findConceptsByIds } from '../repositories/scenarioRepository';
import { getMisconceptionsForUser } from '../repositories/progressRepository';
import { db } from '../db/client';
import { tutorCache, concepts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export const tutorRouter = Router();
tutorRouter.use(requireAuth);

// Strict rate limit for AI endpoints
const tutorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many tutor requests, please try again.' } },
});
tutorRouter.use(tutorLimiter);

// ─── Cache helper ─────────────────────────────────────────────────────────

function makeCacheKey(parts: object): string {
  return crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

async function getCached(key: string): Promise<object | null> {
  const [row] = await db.select().from(tutorCache).where(eq(tutorCache.cacheKey, key));
  return row ? (row.response as object) : null;
}

async function setCache(key: string, response: object, language: string): Promise<void> {
  await db
    .insert(tutorCache)
    .values({ cacheKey: key, response, language })
    .onConflictDoNothing();
}

// ─── POST /api/tutor/explain ───────────────────────────────────────────────

tutorRouter.post('/explain', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = ExplainBodySchema.parse(req.body);

    const cacheKey = makeCacheKey({
      t: 'explain',
      decisionId: body.decisionId,
      selectedOptionIds: [...body.selectedOptionIds].sort(),
      language: body.language,
    });

    // Check cache
    const cached = await getCached(cacheKey);
    if (cached) {
      res.json({ explanation: { ...cached, aiGenerated: true, language: body.language } });
      return;
    }

    // Fetch decision and scenario data
    const decision = await findDecisionById(body.decisionId);
    if (!decision) throw new AppError(404, 'NOT_FOUND', 'Decision not found');

    const scenario = await findScenarioById(body.scenarioId);
    if (!scenario) throw new AppError(404, 'NOT_FOUND', 'Scenario not found');

    // Get concepts for this decision
    const scenarioConcepts = await findConceptsByIds(scenario.conceptIds);
    const primaryConcept = scenarioConcepts[0];

    // Build static fallback from option feedback
    const selectedOptions = decision.options.filter((o) => body.selectedOptionIds.includes(o.id));
    const staticFeedback = selectedOptions.map((o) => o.feedback).join(' ');

    const staticFallback = {
      technicalReason: staticFeedback || 'See the option feedback above.',
      analogy: primaryConcept?.analogyBase ?? 'No analogy available.',
      tradeOff: selectedOptions.map((o) => o.consequence).join(' '),
      followUpQuestion: 'Review the Microsoft Learn link for this concept.',
      conceptsToRevise: scenarioConcepts.map((c) => ({ id: c.id, name: c.name, learnUrl: c.learnUrl })),
    };

    // Try LLM with fallback
    let explanation;
    try {
      const system = buildExplainSystemPrompt({
        language: body.language,
        analogyBase: primaryConcept?.analogyBase ?? '',
        conceptSummary: primaryConcept?.summary ?? '',
        verifiedFeedback: staticFeedback,
        learnUrl: primaryConcept?.learnUrl ?? '',
      });

      const userMessage = `The learner answered decision "${decision.prompt}" by selecting options: ${body.selectedOptionIds.join(', ')}. Provide an explanation.`;

      const raw = await llmClient.complete(system, [{ role: 'user', content: userMessage }], {
        maxTokens: 800,
        temperature: 0.3,
        timeoutMs: 10_000,
      });

      // Parse and validate — retry once on invalid JSON
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        logger.warn('LLM returned invalid JSON, retrying once');
        const raw2 = await llmClient.complete(system, [{ role: 'user', content: userMessage }], {
          maxTokens: 800,
          temperature: 0.1,
        });
        parsed = JSON.parse(raw2);
      }

      explanation = {
        ...staticFallback,
        technicalReason: parsed.technicalReason ?? staticFallback.technicalReason,
        analogy: parsed.analogy ?? staticFallback.analogy,
        tradeOff: parsed.tradeOff ?? staticFallback.tradeOff,
        followUpQuestion: parsed.followUpQuestion ?? staticFallback.followUpQuestion,
      };

      await setCache(cacheKey, explanation, body.language);
    } catch (llmErr) {
      // Graceful degradation — return static explanation
      logger.warn({ llmErr }, 'LLM failed, falling back to static explanation');
      explanation = staticFallback;
    }

    res.json({
      explanation: { ...explanation, aiGenerated: true, language: body.language },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/tutor/chat ──────────────────────────────────────────────────

tutorRouter.post('/chat', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = ChatBodySchema.parse(req.body);

    const misconceptions = await getMisconceptionsForUser(userId);
    const topMisconceptions = misconceptions
      .filter((m) => m.count >= 2)
      .slice(0, 3)
      .map((m) => m.conceptPair);

    let scenarioContext: string | undefined;
    if (body.scenarioId) {
      const scenario = await findScenarioById(body.scenarioId);
      scenarioContext = scenario?.title;
    }

    const system = buildChatSystemPrompt({
      language: body.language,
      topMisconceptions,
      scenarioContext,
    });

    // Delimit learner messages to prevent prompt injection
    const safeMessages = body.messages.map((m) =>
      m.role === 'user'
        ? { ...m, content: `<learner_text>${m.content}</learner_text>` }
        : m,
    );

    let reply: string;
    try {
      reply = await llmClient.complete(system, safeMessages, {
        maxTokens: 600,
        temperature: 0.5,
        timeoutMs: 10_000,
      });
    } catch (llmErr) {
      logger.warn({ llmErr }, 'LLM chat failed, returning fallback');
      reply = 'I\'m having trouble connecting right now. Please review the verified explanation above, or visit the Microsoft Learn link for this concept.';
    }

    res.json({ reply, aiGenerated: true });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/tutor/practice ─────────────────────────────────────────────

tutorRouter.post('/practice', async (req, res, next) => {
  try {
    const body = PracticeBodySchema.parse(req.body);
    const [conceptIdA, conceptIdB] = body.misconceptionPair.split('|');

    if (!conceptIdA || !conceptIdB) {
      throw new AppError(400, 'INVALID_INPUT', 'Invalid misconception pair format');
    }

    const [conceptA, conceptB] = await Promise.all([
      findConceptsByIds([conceptIdA]).then((r) => r[0]),
      findConceptsByIds([conceptIdB]).then((r) => r[0]),
    ]);

    if (!conceptA || !conceptB) {
      throw new AppError(404, 'NOT_FOUND', 'Concepts not found');
    }

    const system = buildPracticeSystemPrompt({
      conceptNameA: conceptA.name,
      conceptNameB: conceptB.name,
      conceptSummaryA: conceptA.summary,
      conceptSummaryB: conceptB.summary,
    });

    let practiceScenario;
    try {
      const raw = await llmClient.complete(system, [{ role: 'user', content: 'Generate the practice scenario.' }], {
        maxTokens: 1200,
        temperature: 0.7,
        timeoutMs: 15_000,
      });

      practiceScenario = JSON.parse(raw);
      practiceScenario.aiGenerated = true;
      practiceScenario.verified = false;
      practiceScenario.domains = [conceptA.domain];
    } catch (err) {
      logger.warn({ err }, 'LLM practice generation failed');
      throw new AppError(503, 'LLM_UNAVAILABLE', 'Could not generate practice scenario. Please try again later.');
    }

    res.json({ scenario: practiceScenario });
  } catch (err) {
    next(err);
  }
});
