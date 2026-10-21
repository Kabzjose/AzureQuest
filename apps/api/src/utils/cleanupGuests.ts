/**
 * Cleanup script: deletes guest accounts with no activity for 30+ days.
 * Run via: npm run db:cleanup-guests
 */
import 'dotenv/config';
import { db, pool } from '../db/client';
import { users } from '../db/schema';
import { and, eq, lt, sql } from 'drizzle-orm';
import { logger } from './logger';

async function cleanupGuests() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  logger.info({ cutoff }, 'Cleaning up inactive guest accounts');

  const deleted = await db
    .delete(users)
    .where(and(eq(users.isGuest, true), lt(users.lastActiveAt, cutoff)))
    .returning({ id: users.id });

  logger.info({ count: deleted.length }, 'Guest accounts deleted');
}

cleanupGuests()
  .catch((err) => {
    logger.error({ err }, 'Cleanup failed');
    process.exit(1);
  })
  .finally(() => pool.end());
