import { db } from '../db/client';
import { attempts, decisionResponses, flashcardStates, misconceptionStats } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { MistakeType } from '@azurequest/shared';

// ─── Attempts ──────────────────────────────────────────────────────────────

export async function createAttempt(userId: string, scenarioId: string) {
  const [row] = await db
    .insert(attempts)
    .values({ userId, scenarioId })
    .returning();
  return row;
}

export async function findAttemptById(attemptId: string, userId: string) {
  // ALWAYS filter by userId — prevents cross-user access
  const [row] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)));
  return row ?? null;
}

export async function completeAttempt(attemptId: string, userId: string, score: number) {
  const [row] = await db
    .update(attempts)
    .set({ completedAt: new Date(), score })
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
    .returning();
  return row ?? null;
}

// ─── Decision Responses ────────────────────────────────────────────────────

export async function saveDecisionResponse(params: {
  attemptId: string;
  decisionId: string;
  userId: string;
  scenarioId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  partialScore: number;
  mistakeTags: string[];
  optionalReasoning?: string;
  fromVerifiedScenario: boolean;
}) {
  const [row] = await db.insert(decisionResponses).values(params).returning();
  return row;
}

export async function findResponsesForAttempt(attemptId: string, userId: string) {
  // ALWAYS filter by userId
  return db
    .select()
    .from(decisionResponses)
    .where(and(eq(decisionResponses.attemptId, attemptId), eq(decisionResponses.userId, userId)));
}

// ─── Flashcard States ──────────────────────────────────────────────────────

const LEITNER_DAYS = [0, 1, 3, 7]; // index = box number (box 1→1 day, box 2→3 days, box 3→7 days)

export async function upsertFlashcardDue(userId: string, conceptId: string) {
  // Box 1, due tomorrow
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db
    .insert(flashcardStates)
    .values({ userId, conceptId, box: 1, nextReviewAt: tomorrow })
    .onConflictDoUpdate({
      target: [flashcardStates.userId, flashcardStates.conceptId],
      set: { box: 1, nextReviewAt: tomorrow, updatedAt: new Date() },
    });
}

export async function reviewFlashcard(userId: string, conceptId: string, correct: boolean) {
  const [existing] = await db
    .select()
    .from(flashcardStates)
    .where(and(eq(flashcardStates.userId, userId), eq(flashcardStates.conceptId, conceptId)));

  if (!existing) return null;

  const currentBox = existing.box;
  const newBox = correct ? Math.min(3, currentBox + 1) : 1;
  const daysToAdd = LEITNER_DAYS[newBox] ?? 1;
  const nextReviewAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(flashcardStates)
    .set({
      box: newBox,
      nextReviewAt,
      timesCorrect: correct ? existing.timesCorrect + 1 : existing.timesCorrect,
      timesWrong: correct ? existing.timesWrong : existing.timesWrong + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(flashcardStates.userId, userId), eq(flashcardStates.conceptId, conceptId)))
    .returning();
  return updated ?? null;
}

export async function getDueFlashcards(userId: string) {
  // ALWAYS filter by userId
  const now = new Date();
  const rows = await db
    .select()
    .from(flashcardStates)
    .where(and(eq(flashcardStates.userId, userId)));
  return rows.filter((r) => r.nextReviewAt <= now);
}

// ─── Misconception Stats ────────────────────────────────────────────────────

/** Canonical pair key: smaller UUID first */
export function makePairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export async function upsertMisconception(userId: string, conceptIdA: string, conceptIdB: string) {
  const conceptPair = makePairKey(conceptIdA, conceptIdB);
  // Use raw SQL for atomic upsert with increment — Drizzle's onConflictDoUpdate
  // doesn't easily support incrementing an existing value in the conflict clause.
  const { sql } = await import('drizzle-orm');
  await db.execute(sql`
    INSERT INTO misconception_stats (id, user_id, concept_pair, count, last_seen_at)
    VALUES (gen_random_uuid(), ${userId}::uuid, ${conceptPair}, 1, NOW())
    ON CONFLICT (user_id, concept_pair)
    DO UPDATE SET count = misconception_stats.count + 1, last_seen_at = NOW()
  `);
}

export async function getMisconceptions(userId: string) {
  // ALWAYS filter by userId
  return db
    .select()
    .from(misconceptionStats)
    .where(eq(misconceptionStats.userId, userId));
}
