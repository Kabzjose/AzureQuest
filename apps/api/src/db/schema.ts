/**
 * Drizzle ORM schema for AzureQuest.
 *
 * Design decisions:
 * - UUID primary keys for all tables (avoids enumeration attacks and is workspace-safe).
 * - JSON columns for arrays (requirements, conceptIds, selectedOptionIds) — avoids
 *   many-to-many pivot tables for content that is always read together.
 * - No Row Level Security: security is enforced in the repository layer, which
 *   always requires a userId and filters by it.
 * - `options` stores the full option data as a JSONB column on `decisions` to avoid
 *   a 4-table join on every scenario fetch. The decision table references its parent
 *   scenario so we can query by scenario.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  real,
  timestamp,
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { OptionFull } from '@azurequest/shared';

// ─── Users ─────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: text('password_hash'),
  isGuest: boolean('is_guest').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Refresh Tokens ────────────────────────────────────────────────────────

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (t) => ({
  userIdx: index('rt_user_idx').on(t.userId),
}));

// ─── Concepts ──────────────────────────────────────────────────────────────

export const concepts = pgTable('concepts', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: varchar('domain', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  summary: text('summary').notNull(),
  learnUrl: text('learn_url').notNull(),
  analogyBase: text('analogy_base').notNull(),
  analogyBaseSw: text('analogy_base_sw'),
});

// ─── Scenarios ─────────────────────────────────────────────────────────────

export const scenarios = pgTable('scenarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  domains: json('domains').$type<string[]>().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  story: text('story').notNull(),
  context: varchar('context', { length: 255 }).notNull(),
  requirements: json('requirements').$type<string[]>().notNull(),
  difficulty: integer('difficulty').notNull(),
  conceptIds: json('concept_ids').$type<string[]>().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  verified: boolean('verified').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Decisions ─────────────────────────────────────────────────────────────
// Options are stored as JSONB on the decision row to avoid a 4-table join.

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  scenarioId: uuid('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  type: varchar('type', { length: 10 }).notNull(),    // 'single' | 'multi'
  options: json('options').$type<OptionFull[]>().notNull(),
  orderIndex: integer('order_index').notNull().default(0),
}, (t) => ({
  scenarioIdx: index('decisions_scenario_idx').on(t.scenarioId),
}));

// ─── Attempts ──────────────────────────────────────────────────────────────

export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scenarioId: uuid('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  score: real('score'),
}, (t) => ({
  userCreatedIdx: index('attempts_user_created_idx').on(t.userId, t.startedAt),
}));

// ─── Decision Responses ────────────────────────────────────────────────────

export const decisionResponses = pgTable('decision_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  attemptId: uuid('attempt_id').notNull().references(() => attempts.id, { onDelete: 'cascade' }),
  decisionId: uuid('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scenarioId: uuid('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  selectedOptionIds: json('selected_option_ids').$type<string[]>().notNull(),
  isCorrect: boolean('is_correct').notNull(),
  partialScore: real('partial_score').notNull(),
  mistakeTags: json('mistake_tags').$type<string[]>().notNull(),
  optionalReasoning: text('optional_reasoning'),
  // Whether this response came from a verified (non-AI) scenario
  fromVerifiedScenario: boolean('from_verified_scenario').notNull().default(true),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userCreatedIdx: index('dr_user_created_idx').on(t.userId, t.answeredAt),
  attemptIdx: index('dr_attempt_idx').on(t.attemptId),
}));

// ─── Flashcard States ──────────────────────────────────────────────────────

export const flashcardStates = pgTable('flashcard_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  conceptId: uuid('concept_id').notNull().references(() => concepts.id, { onDelete: 'cascade' }),
  box: integer('box').notNull().default(1),
  nextReviewAt: timestamp('next_review_at', { withTimezone: true }).notNull(),
  timesCorrect: integer('times_correct').notNull().default(0),
  timesWrong: integer('times_wrong').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // One flashcard state per user and concept
  userConceptUniq: uniqueIndex('fs_user_concept_uniq').on(t.userId, t.conceptId),
  userIdx: index('fs_user_idx').on(t.userId),
}));

// ─── Misconception Stats ────────────────────────────────────────────────────

export const misconceptionStats = pgTable('misconception_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  /** Canonical form: smaller UUID first, pipe-separated */
  conceptPair: varchar('concept_pair', { length: 73 }).notNull(),  // 2×36 + 1
  count: integer('count').notNull().default(1),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userPairUniq: uniqueIndex('ms_user_pair_uniq').on(t.userId, t.conceptPair),
  userIdx: index('ms_user_idx').on(t.userId),
}));

// ─── Tutor Cache ───────────────────────────────────────────────────────────
// Caches deterministic AI explanations (same inputs → same output).

export const tutorCache = pgTable('tutor_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  cacheKey: text('cache_key').notNull().unique(),
  response: json('response').notNull(),
  language: varchar('language', { length: 5 }).notNull().default('en'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
