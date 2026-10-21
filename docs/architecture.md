# AzureQuest Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│  React 18 + TypeScript + Vite + Tailwind CSS        │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Auth Store │  │ TanStack     │  │ React Router│ │
│  │ (Zustand)  │  │ Query        │  │ v6          │ │
│  └────────────┘  └──────────────┘  └─────────────┘ │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS + Bearer JWT
                         │ httpOnly cookie (refresh token)
┌────────────────────────▼────────────────────────────┐
│                   Express API                        │
│  Node.js 20 + TypeScript                           │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────┐ │
│  │  Routes  │ │ Grading │ │Readiness │ │  LLM   │ │
│  │          │ │ Engine  │ │ Service  │ │ Client │ │
│  └────┬─────┘ └─────────┘ └──────────┘ └───┬────┘ │
│       │  Repositories (userId-filtered)      │      │
└───────┼──────────────────────────────────────┼──────┘
        │                                      │
┌───────▼──────────────┐          ┌────────────▼──────┐
│   Neon PostgreSQL    │          │   LLM Provider    │
│   (pooled, TLS)      │          │ OpenAI/Gemini/Mock │
│   Drizzle ORM        │          └───────────────────┘
└──────────────────────┘
```

## Security Architecture

### Auth flow

1. `POST /api/auth/guest` → creates user row → returns JWT (15min) + httpOnly refresh cookie (30d, hashed in DB)
2. Client stores JWT in Zustand memory (never localStorage)
3. On every page load → `POST /api/auth/refresh` → browser sends refresh cookie automatically → rotated JWT returned
4. `POST /api/auth/logout` → server revokes refresh token in DB → client clears Zustand

### Answer key protection

The answer key (`isCorrect`, `mistakeType`, `confusedWithConceptId`) is **never sent to the client before submission**. The `stripScenario()` function in `answerKeyStrip.ts` is called on every `GET /scenarios/:id` response. Grading happens entirely server-side.

### Repository pattern (no RLS)

Instead of PostgreSQL Row Level Security, every repository function requires a `userId` argument and always adds a `WHERE user_id = $userId` clause. Controllers never query user-owned tables directly. This approach is testable at the unit level without needing a database.

## Data Flow: Challenge Player

```
1. GET /api/scenarios/:id
   └── stripScenario() removes isCorrect, mistakeType, confusedWithConceptId
   └── Client renders options with no answer data

2. User selects option(s) + clicks Submit

3. POST /api/attempts/:id/decisions
   └── Server fetches decision with full options from DB
   └── gradeDecision() computes isCorrect, partialScore, mistakeTags
   └── Saves DecisionResponse to DB
   └── Side effects: upsertFlashcardDue(), upsertMisconception()
   └── Returns GradeResult (now includes per-option feedback + isCorrect)

4. Client animates "consequence reveal"
5. User clicks "Why did I get this wrong?"

6. POST /api/tutor/explain
   └── Checks tutor_cache first
   └── Builds grounded system prompt (includes verified feedback + analogyBase)
   └── Calls LLM (10s timeout)
   └── Validates JSON output with zod
   └── Falls back to static explanation on failure
   └── Caches deterministic responses

7. TutorDrawer renders: technicalReason / analogy / tradeOff / followUpQuestion
   └── Language toggle switches between English and Kiswahili
```

## Database Schema Overview

```
users ─────────────────────────────────────────────┐
  ├── refresh_tokens (CASCADE DELETE)              │
  ├── attempts (CASCADE DELETE) ──────────────────┤
  │     └── decision_responses (CASCADE DELETE)   │
  ├── flashcard_states (CASCADE DELETE)           │
  └── misconception_stats (CASCADE DELETE)        │
                                                  │
concepts ─────────────────────────────────────────┤
  └── (referenced by flashcard_states.concept_id) │
                                                  │
scenarios ────────────────────────────────────────┘
  └── decisions (CASCADE DELETE)
        └── options stored as JSONB on decisions row
```

Key design decisions:
- **Options as JSONB on decisions**: avoids a 4-table join on scenario fetch; options are always read together with their decision
- **Concepts as a separate table**: enables flashcard FK and misconception tracking without duplicating data
- **UUID PKs everywhere**: avoids enumeration attacks; workspace-safe (no sequences)
- **Misconception pair key**: canonical form (smaller UUID first, pipe-separated) ensures `A|B == B|A`
