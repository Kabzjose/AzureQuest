import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { SubmitDecisionBodySchema } from '@azurequest/shared';
import { AppError } from '../middleware/errorHandler';
import {
  createAttempt,
  findAttemptById,
  completeAttempt,
  saveDecisionResponse,
  findResponsesForAttempt,
  upsertFlashcardDue,
  upsertMisconception,
} from '../repositories/attemptRepository';
import { findScenarioById, findDecisionById, findConceptsByIds } from '../repositories/scenarioRepository';
import { gradeDecision } from '../services/gradingEngine';
import { z } from 'zod';

export const attemptsRouter = Router();
attemptsRouter.use(requireAuth);

// POST /api/attempts — start a new attempt
attemptsRouter.post('/', async (req, res, next) => {
  try {
    const { scenarioId } = z.object({ scenarioId: z.string().uuid() }).parse(req.body);
    const scenario = await findScenarioById(scenarioId);
    if (!scenario || scenario.status !== 'published') {
      throw new AppError(404, 'NOT_FOUND', 'Scenario not found');
    }
    const attempt = await createAttempt(req.user!.id, scenarioId);
    res.status(201).json({ attempt });
  } catch (err) {
    next(err);
  }
});

// POST /api/attempts/:id/decisions — submit and grade a decision
attemptsRouter.post('/:id/decisions', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const attemptId = req.params.id;

    const attempt = await findAttemptById(attemptId, userId);
    if (!attempt) throw new AppError(404, 'NOT_FOUND', 'Attempt not found');
    if (attempt.completedAt) throw new AppError(400, 'ATTEMPT_COMPLETE', 'Attempt already completed');

    const body = SubmitDecisionBodySchema.parse(req.body);
    const decision = await findDecisionById(body.decisionId);
    if (!decision) throw new AppError(404, 'NOT_FOUND', 'Decision not found');
    const scenario = await findScenarioById(attempt.scenarioId);
    if (!scenario) throw new AppError(404, 'NOT_FOUND', 'Scenario not found');

    // Grade server-side — never trust client correctness
    const gradeResult = gradeDecision({
      options: decision.options,
      selectedOptionIds: body.selectedOptionIds,
      type: decision.type,
    });

    // Prefer explicit misconception mappings, but always give a failed answer
    // a useful revision card for the scenario's linked concepts.
    const confusedConceptIds = decision.options
      .filter((o) => body.selectedOptionIds.includes(o.id) && !o.isCorrect && o.confusedWithConceptId)
      .map((o) => o.confusedWithConceptId!);
    const conceptIdsToRevise = confusedConceptIds.length > 0
      ? [...new Set(confusedConceptIds)]
      : [...new Set(scenario.conceptIds)];

    // Fetch concepts to build conceptsToRevise
    const conceptsToRevise: Array<{ id: string; name: string; learnUrl: string }> = [];
    if (conceptIdsToRevise.length > 0) {
      const foundConcepts = await findConceptsByIds(conceptIdsToRevise);
      for (const c of foundConcepts) {
        conceptsToRevise.push({ id: c.id, name: c.name, learnUrl: c.learnUrl });
      }
    }
    gradeResult.conceptsToRevise = conceptsToRevise;

    // Persist response
    await saveDecisionResponse({
      attemptId,
      decisionId: body.decisionId,
      userId,
      scenarioId: attempt.scenarioId,
      selectedOptionIds: body.selectedOptionIds,
      isCorrect: gradeResult.isCorrect,
      partialScore: gradeResult.partialScore,
      mistakeTags: gradeResult.mistakeTags,
      optionalReasoning: body.optionalReasoning,
      fromVerifiedScenario: true, // seeded scenarios are always verified
    });

    // Side effects on wrong answers
    if (!gradeResult.isCorrect) {
      // Create/reset flashcards for every concept relevant to the failed answer.
      for (const conceptId of conceptIdsToRevise) {
        await upsertFlashcardDue(userId, conceptId);
      }
      // Update misconception stats
      const wrongOptions = decision.options.filter(
        (o) => body.selectedOptionIds.includes(o.id) && !o.isCorrect && o.confusedWithConceptId,
      );
      for (const opt of wrongOptions) {
        // Find the correct concept for this decision (first correct option's concept)
        // We record confusion between the scenario's concept and the confused concept
        if (opt.confusedWithConceptId) {
          // Use the scenario's primary concept as the "correct" side of the pair
          const primaryConceptId = scenario.conceptIds[0];
          if (primaryConceptId) {
            await upsertMisconception(userId, primaryConceptId, opt.confusedWithConceptId);
          }
        }
      }
    }

    res.json({ gradeResult });
  } catch (err) {
    next(err);
  }
});

// POST /api/attempts/:id/complete
attemptsRouter.post('/:id/complete', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const attemptId = req.params.id;

    const attempt = await findAttemptById(attemptId, userId);
    if (!attempt) throw new AppError(404, 'NOT_FOUND', 'Attempt not found');

    // Calculate final score from responses
    const responses = await findResponsesForAttempt(attemptId, userId);
    const score = responses.length > 0
      ? responses.reduce((sum, r) => sum + r.partialScore, 0) / responses.length
      : 0;

    const completed = await completeAttempt(attemptId, userId, score);
    res.json({ attempt: completed });
  } catch (err) {
    next(err);
  }
});
