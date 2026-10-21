import { db } from '../db/client';
import { users, refreshTokens } from '../db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import type { User } from '@azurequest/shared';

// ─── User queries ──────────────────────────────────────────────────────────

export async function createGuestUser(): Promise<User> {
  const [row] = await db.insert(users).values({ isGuest: true }).returning();
  return mapUser(row);
}

export async function findUserById(id: string): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row ? mapUser(row) : null;
}

export async function findUserByEmail(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email));
  return row ?? null;
}

export async function createFullUser(email: string, passwordHash: string): Promise<User> {
  const [row] = await db
    .insert(users)
    .values({ email, passwordHash, isGuest: false })
    .returning();
  return mapUser(row);
}

export async function upgradeGuestToFullUser(
  userId: string,
  email: string,
  passwordHash: string,
): Promise<User> {
  const [row] = await db
    .update(users)
    .set({ email, passwordHash, isGuest: false })
    .where(eq(users.id, userId))
    .returning();
  return mapUser(row);
}

export async function touchLastActive(userId: string): Promise<void> {
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId));
}

// ─── Refresh token queries ─────────────────────────────────────────────────

export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });
}

export async function findValidRefreshToken(tokenHash: string) {
  const now = new Date();
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        gt(refreshTokens.expiresAt, now),
        isNull(refreshTokens.revokedAt),
      ),
    );
  return row ?? null;
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}

// ─── Mapping ───────────────────────────────────────────────────────────────

function mapUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email ?? null,
    isGuest: row.isGuest,
    createdAt: row.createdAt.toISOString(),
  };
}
