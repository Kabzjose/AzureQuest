import { Router } from 'express';
import { db, withRetry } from '../db/client';
import { concepts } from '../db/schema';
import { requireAuth } from '../middleware/auth';

export const conceptsRouter = Router();

// GET /api/concepts — public, returns all concepts (no answer keys, concepts have none)
conceptsRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const rows = await withRetry(() => db.select().from(concepts), 3, 'get concepts');
    res.json({ concepts: rows });
  } catch (err) {
    next(err);
  }
});
