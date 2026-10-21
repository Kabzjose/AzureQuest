import { db, withRetry } from '../db/client';
import { scenarios, decisions, concepts } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { ScenarioFull, DecisionFull, OptionFull, Domain } from '@azurequest/shared';

// ─── Build a full ScenarioFull from DB rows ───────────────────────────────

async function buildScenario(
  scenarioRow: typeof scenarios.$inferSelect,
): Promise<ScenarioFull> {
  const decisionRows = await db
    .select()
    .from(decisions)
    .where(eq(decisions.scenarioId, scenarioRow.id))
    .orderBy(decisions.orderIndex);

  const fullDecisions: DecisionFull[] = decisionRows.map((d) => ({
    id: d.id,
    prompt: d.prompt,
    type: d.type as 'single' | 'multi',
    options: d.options as OptionFull[],
  }));

  return {
    id: scenarioRow.id,
    domains: scenarioRow.domains as Domain[],
    title: scenarioRow.title,
    story: scenarioRow.story,
    context: scenarioRow.context,
    requirements: scenarioRow.requirements as string[],
    difficulty: scenarioRow.difficulty,
    conceptIds: scenarioRow.conceptIds as string[],
    decisions: fullDecisions,
    status: scenarioRow.status as 'published' | 'draft',
    aiGenerated: scenarioRow.aiGenerated,
    verified: scenarioRow.verified,
  };
}

export async function findPublishedScenarios(filters?: {
  domain?: Domain;
  difficulty?: number;
}): Promise<ScenarioFull[]> {
  const rows = await withRetry(
    () => db.select().from(scenarios).where(eq(scenarios.status, 'published')),
    3,
    'list scenarios',
  );

  let filtered = rows;
  if (filters?.domain) {
    // domains is a JSON array — filter in JS after fetching
    filtered = filtered.filter((r) =>
      (r.domains as string[]).includes(filters.domain!),
    );
  }
  if (filters?.difficulty) {
    filtered = filtered.filter((r) => r.difficulty === filters.difficulty);
  }

  return Promise.all(filtered.map(buildScenario));
}

export async function findScenarioById(id: string): Promise<ScenarioFull | null> {
  const [row] = await withRetry(
    () => db.select().from(scenarios).where(eq(scenarios.id, id)),
    3,
    'get scenario',
  );
  if (!row) return null;
  return buildScenario(row);
}

export async function findDecisionById(id: string): Promise<DecisionFull | null> {
  const [row] = await db.select().from(decisions).where(eq(decisions.id, id));
  if (!row) return null;
  return {
    id: row.id,
    prompt: row.prompt,
    type: row.type as 'single' | 'multi',
    options: row.options as OptionFull[],
  };
}

export async function findConceptsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.select().from(concepts).where(inArray(concepts.id, ids));
}
