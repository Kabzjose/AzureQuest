/**
 * Neon-resilient database client.
 *
 * Why pg Pool instead of the Neon HTTP driver?
 * - We need real connection pooling (PgBouncer behind the Neon -pooler host)
 *   so that Lambda-style cold starts don't exhaust connection slots.
 * - `idleTimeoutMillis` keeps connections alive long enough to service bursts
 *   but not so long that they block Neon's compute from suspending.
 * - `connectionTimeoutMillis` is generous (30s) to absorb Neon cold-start wake-up
 *   latency (typically 1–5s but can be up to ~15s on the free tier).
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { logger } from '../utils/logger';

// Validate required environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                      // small pool — Neon free tier has limited connections
  idleTimeoutMillis: 30_000,   // release idle connections after 30s
  connectionTimeoutMillis: 30_000, // wait up to 30s for a connection (covers Neon wake-up)
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

export const db = drizzle(pool, { schema });

// ─── Retry helper ──────────────────────────────────────────────────────────

const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  '57P01', // admin_shutdown
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
]);

function isConnectionError(err: unknown): boolean {
  if (err instanceof Error) {
    const pgErr = err as { code?: string };
    if (pgErr.code && CONNECTION_ERROR_CODES.has(pgErr.code)) return true;
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) return true;
  }
  return false;
}

/**
 * Retries a database operation up to `maxAttempts` times on connection errors only.
 * Non-idempotent writes should not be passed here blindly — wrap only reads
 * or idempotent upserts.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  label = 'db operation',
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isConnectionError(err) || attempt === maxAttempts) {
        throw err;
      }
      const delayMs = 200 * 2 ** (attempt - 1); // 200ms, 400ms
      logger.warn({ err, attempt, delayMs, label }, 'DB connection error, retrying');
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}
