import { z } from 'zod';

// ─── Domain ────────────────────────────────────────────────────────────────

export const DomainSchema = z.enum([
  'cloud-concepts',
  'architecture-services',
  'management-governance',
]);
export type Domain = z.infer<typeof DomainSchema>;

export const DOMAIN_WEIGHTS: Record<Domain, { min: number; max: number; midpoint: number }> = {
  'cloud-concepts': { min: 25, max: 30, midpoint: 27.5 },
  'architecture-services': { min: 35, max: 40, midpoint: 37.5 },
  'management-governance': { min: 30, max: 35, midpoint: 32.5 },
};

// ─── Concept ───────────────────────────────────────────────────────────────

export const ConceptSchema = z.object({
  id: z.string().uuid(),
  domain: DomainSchema,
  name: z.string().min(1),
  summary: z.string().min(1),
  learnUrl: z.string().url(),
  analogyBase: z.string().min(1),
  analogyBaseSw: z.string().optional(),
});
export type Concept = z.infer<typeof ConceptSchema>;

// ─── Option (with and without answer key) ──────────────────────────────────

export const MistakeTypeSchema = z.enum([
  'service-mixup',
  'vocabulary-gap',
  'requirements-misread',
  'overengineering',
]);
export type MistakeType = z.infer<typeof MistakeTypeSchema>;

/** Full option including answer key — server-side only */
export const OptionFullSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  isCorrect: z.boolean(),
  feedback: z.string().min(1),
  consequence: z.string().min(1),
  mistakeType: MistakeTypeSchema.optional(),
  confusedWithConceptId: z.string().uuid().optional(),
});
export type OptionFull = z.infer<typeof OptionFullSchema>;

/** Stripped option sent to client before submission */
export const OptionPublicSchema = OptionFullSchema.omit({
  isCorrect: true,
  mistakeType: true,
  confusedWithConceptId: true,
});
export type OptionPublic = z.infer<typeof OptionPublicSchema>;

// ─── Decision ──────────────────────────────────────────────────────────────

export const DecisionTypeSchema = z.enum(['single', 'multi']);
export type DecisionType = z.infer<typeof DecisionTypeSchema>;

export const DecisionFullSchema = z.object({
  id: z.string().uuid(),
  prompt: z.string().min(1),
  type: DecisionTypeSchema,
  options: z.array(OptionFullSchema),
});
export type DecisionFull = z.infer<typeof DecisionFullSchema>;

export const DecisionPublicSchema = DecisionFullSchema.omit({ options: true }).extend({
  options: z.array(OptionPublicSchema),
});
export type DecisionPublic = z.infer<typeof DecisionPublicSchema>;

// ─── Scenario ──────────────────────────────────────────────────────────────

export const ScenarioStatusSchema = z.enum(['published', 'draft']);
export type ScenarioStatus = z.infer<typeof ScenarioStatusSchema>;

export const ScenarioFullSchema = z.object({
  id: z.string().uuid(),
  domains: z.array(DomainSchema),
  title: z.string().min(1),
  story: z.string().min(1),        // markdown
  context: z.string().min(1),
  requirements: z.array(z.string()),
  difficulty: z.number().int().min(1).max(3),
  conceptIds: z.array(z.string().uuid()),
  decisions: z.array(DecisionFullSchema),
  status: ScenarioStatusSchema,
  aiGenerated: z.boolean().default(false),
  verified: z.boolean().default(true),
});
export type ScenarioFull = z.infer<typeof ScenarioFullSchema>;

export const ScenarioPublicSchema = ScenarioFullSchema.omit({ decisions: true }).extend({
  decisions: z.array(DecisionPublicSchema),
});
export type ScenarioPublic = z.infer<typeof ScenarioPublicSchema>;

/** Card-level view for library listing (no decisions) */
export const ScenarioCardSchema = ScenarioPublicSchema.omit({ decisions: true, story: true });
export type ScenarioCard = z.infer<typeof ScenarioCardSchema>;

// ─── User ──────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  isGuest: z.boolean(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

// ─── Auth ──────────────────────────────────────────────────────────────────

export const GuestAuthResponseSchema = z.object({
  accessToken: z.string(),
  user: UserSchema,
});
export type GuestAuthResponse = z.infer<typeof GuestAuthResponseSchema>;

export const RegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type RegisterBody = z.infer<typeof RegisterBodySchema>;

export const LoginBodySchema = RegisterBodySchema;
export type LoginBody = z.infer<typeof LoginBodySchema>;

export const UpgradeBodySchema = RegisterBodySchema;
export type UpgradeBody = z.infer<typeof UpgradeBodySchema>;

// ─── Attempt ───────────────────────────────────────────────────────────────

export const AttemptSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  scenarioId: z.string().uuid(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  score: z.number().nullable(),
});
export type Attempt = z.infer<typeof AttemptSchema>;

// ─── Decision Response / Grading ───────────────────────────────────────────

export const SubmitDecisionBodySchema = z.object({
  decisionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).min(1),
  optionalReasoning: z.string().max(2000).optional(),
});
export type SubmitDecisionBody = z.infer<typeof SubmitDecisionBodySchema>;

/** Result returned to client after grading */
export const GradeResultSchema = z.object({
  isCorrect: z.boolean(),
  partialScore: z.number().min(0).max(1),
  mistakeTags: z.array(MistakeTypeSchema),
  /** Full per-option feedback revealed after submission */
  optionResults: z.array(z.object({
    optionId: z.string().uuid(),
    isCorrect: z.boolean(),
    feedback: z.string(),
    consequence: z.string(),
    wasSelected: z.boolean(),
  })),
  conceptsToRevise: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    learnUrl: z.string(),
  })),
});
export type GradeResult = z.infer<typeof GradeResultSchema>;

// ─── Flashcard ─────────────────────────────────────────────────────────────

export const FlashcardStateSchema = z.object({
  conceptId: z.string().uuid(),
  conceptName: z.string(),
  conceptSummary: z.string(),
  analogyBase: z.string(),
  learnUrl: z.string().url(),
  box: z.number().int().min(1).max(3),
  nextReviewAt: z.string().datetime(),
  timesCorrect: z.number().int(),
  timesWrong: z.number().int(),
});
export type FlashcardState = z.infer<typeof FlashcardStateSchema>;

export const ReviewBodySchema = z.object({
  correct: z.boolean(),
});
export type ReviewBody = z.infer<typeof ReviewBodySchema>;

// ─── Progress ──────────────────────────────────────────────────────────────

export const DomainScoreSchema = z.object({
  domain: DomainSchema,
  score: z.number().nullable(),         // null = "Not enough data"
  answeredCount: z.number().int(),
  weight: z.object({ min: z.number(), max: z.number(), midpoint: z.number() }),
});
export type DomainScore = z.infer<typeof DomainScoreSchema>;

export const ReadinessLabelSchema = z.enum([
  'Keep practising',
  'Almost there',
  'Looking strong',
  'Not enough data',
]);
export type ReadinessLabel = z.infer<typeof ReadinessLabelSchema>;

export const ReadinessSchema = z.object({
  overall: z.number().nullable(),
  label: ReadinessLabelSchema,
  domains: z.array(DomainScoreSchema),
  disclaimer: z.literal('This is a practice-based estimate, not a prediction of your official exam result.'),
});
export type Readiness = z.infer<typeof ReadinessSchema>;

export const MisconceptionStatSchema = z.object({
  conceptPair: z.string(),   // "conceptId_A|conceptId_B"
  conceptNameA: z.string(),
  conceptNameB: z.string(),
  count: z.number().int(),
  lastSeenAt: z.string().datetime(),
});
export type MisconceptionStat = z.infer<typeof MisconceptionStatSchema>;

export const NextActivitySchema = z.object({
  type: z.enum(['scenario', 'flashcard', 'practice']),
  label: z.string(),
  scenarioId: z.string().uuid().optional(),
  domain: DomainSchema.optional(),
  misconceptionPair: z.string().optional(),
});
export type NextActivity = z.infer<typeof NextActivitySchema>;

// ─── Tutor ─────────────────────────────────────────────────────────────────

export const LanguageSchema = z.enum(['en', 'sw']);
export type Language = z.infer<typeof LanguageSchema>;

export const ExplainBodySchema = z.object({
  scenarioId: z.string().uuid(),
  decisionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).min(1),
  language: LanguageSchema.default('en'),
});
export type ExplainBody = z.infer<typeof ExplainBodySchema>;

export const TutorExplanationSchema = z.object({
  technicalReason: z.string(),
  analogy: z.string(),
  tradeOff: z.string(),
  followUpQuestion: z.string(),
  conceptsToRevise: z.array(z.object({ id: z.string(), name: z.string(), learnUrl: z.string() })),
  aiGenerated: z.boolean(),
  language: LanguageSchema,
});
export type TutorExplanation = z.infer<typeof TutorExplanationSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatBodySchema = z.object({
  scenarioId: z.string().uuid().optional(),
  messages: z.array(ChatMessageSchema).max(20),
  language: LanguageSchema.default('en'),
});
export type ChatBody = z.infer<typeof ChatBodySchema>;

export const PracticeBodySchema = z.object({
  misconceptionPair: z.string(),  // "conceptId_A|conceptId_B"
});
export type PracticeBody = z.infer<typeof PracticeBodySchema>;

// ─── API error shape ───────────────────────────────────────────────────────

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
