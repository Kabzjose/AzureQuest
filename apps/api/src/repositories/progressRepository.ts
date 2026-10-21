import { db } from '../db/client';
import { decisionResponses, scenarios, misconceptionStats } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Domain } from '@azurequest/shared';
import type { DomainResponseSummary } from '../services/readinessService';

const DOMAINS: Domain[] = ['cloud-concepts', 'architecture-services', 'management-governance'];

export async function getDomainSummaries(userId: string): Promise<DomainResponseSummary[]> {
  // Fetch all verified responses for the user, with their scenario domain
  const rows = await db
    .select({
      partialScore: decisionResponses.partialScore,
      fromVerifiedScenario: decisionResponses.fromVerifiedScenario,
      scenarioId: decisionResponses.scenarioId,
      answeredAt: decisionResponses.answeredAt,
    })
    .from(decisionResponses)
    .where(
      and(
        eq(decisionResponses.userId, userId),
        eq(decisionResponses.fromVerifiedScenario, true),
      ),
    )
    .orderBy(decisionResponses.answeredAt);

  // Group by domain (need scenario data to get domain)
  // Fetch scenario domains for the scenario IDs in these responses
  const scenarioIds = [...new Set(rows.map((r) => r.scenarioId))];
  if (scenarioIds.length === 0) {
    return DOMAINS.map((d) => ({ domain: d, scores: [] }));
  }

  const scenarioRows = await db
    .select({ id: scenarios.id, domains: scenarios.domains })
    .from(scenarios)
    .where(eq(scenarios.status, 'published'));

  const scenarioDomainMap = new Map<string, Domain[]>();
  for (const s of scenarioRows) {
    scenarioDomainMap.set(s.id, s.domains as Domain[]);
  }

  const domainScores: Record<Domain, number[]> = {
    'cloud-concepts': [],
    'architecture-services': [],
    'management-governance': [],
  };

  for (const row of rows) {
    const domains = scenarioDomainMap.get(row.scenarioId) ?? [];
    for (const domain of domains) {
      if (domain in domainScores) {
        domainScores[domain].push(row.partialScore);
      }
    }
  }

  return DOMAINS.map((d) => ({ domain: d, scores: domainScores[d] }));
}

export async function getMisconceptionsForUser(userId: string) {
  return db
    .select()
    .from(misconceptionStats)
    .where(eq(misconceptionStats.userId, userId))
    .orderBy(desc(misconceptionStats.count));
}
