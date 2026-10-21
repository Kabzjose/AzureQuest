import { Router } from 'express';
import { db, withRetry } from '../db/client';
import { sql } from 'drizzle-orm';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res, next) => {
  const start = Date.now();
  try {
    await withRetry(() => db.execute(sql`SELECT 1`), 2, 'health check');
    const latencyMs = Date.now() - start;
    res.json({ status: 'ok', db: 'up', latencyMs });
  } catch (err) {
    const latencyMs = Date.now() - start;
    next; // let it fall to error handler? No — health should always respond
    res.status(503).json({ status: 'degraded', db: 'down', latencyMs });
  }
});
