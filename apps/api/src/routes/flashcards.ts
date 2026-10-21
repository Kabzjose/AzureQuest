import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ReviewBodySchema } from '@azurequest/shared';
import { getDueFlashcards, reviewFlashcard } from '../repositories/attemptRepository';
import { db } from '../db/client';
import { flashcardStates, concepts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const flashcardsRouter = Router();
flashcardsRouter.use(requireAuth);

// GET /api/flashcards/due
flashcardsRouter.get('/due', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const dueRows = await getDueFlashcards(userId);

    // Enrich with concept data
    const enriched = await Promise.all(
      dueRows.map(async (row) => {
        const [concept] = await db
          .select()
          .from(concepts)
          .where(eq(concepts.id, row.conceptId));
        if (!concept) return null;
        return {
          conceptId: row.conceptId,
          conceptName: concept.name,
          conceptSummary: concept.summary,
          analogyBase: concept.analogyBase,
          analogyBaseSw: concept.analogyBaseSw,
          learnUrl: concept.learnUrl,
          box: row.box,
          nextReviewAt: row.nextReviewAt.toISOString(),
          timesCorrect: row.timesCorrect,
          timesWrong: row.timesWrong,
        };
      }),
    );

    res.json({ flashcards: enriched.filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

// POST /api/flashcards/:conceptId/review
flashcardsRouter.post('/:conceptId/review', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { conceptId } = z.object({ conceptId: z.string().uuid() }).parse(req.params);
    const { correct } = ReviewBodySchema.parse(req.body);

    const updated = await reviewFlashcard(userId, conceptId, correct);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Flashcard not found');

    res.json({ flashcard: updated });
  } catch (err) {
    next(err);
  }
});
