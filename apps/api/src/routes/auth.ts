import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as argon2 from 'argon2';
import { AppError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import {
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
  refreshCookieOptions,
  REFRESH_COOKIE_NAME,
} from '../services/tokenService';
import * as userRepo from '../repositories/userRepository';
import { RegisterBodySchema, UpgradeBodySchema, LoginBodySchema } from '@azurequest/shared';

export const authRouter = Router();

// Strict rate limit for all auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many auth requests, please try again later.' } },
});
authRouter.use(authLimiter);

// ── POST /api/auth/guest ───────────────────────────────────────────────────
authRouter.post('/guest', async (_req, res, next) => {
  try {
    const user = await userRepo.createGuestUser();
    const accessToken = signAccessToken(user.id, true);
    const { raw, hash, expiresAt } = signRefreshToken();
    await userRepo.storeRefreshToken(user.id, hash, expiresAt);
    res.cookie(REFRESH_COOKIE_NAME, raw, refreshCookieOptions());
    res.status(201).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/register ───────────────────────────────────────────────
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password } = RegisterBodySchema.parse(req.body);
    const existing = await userRepo.findUserByEmail(email);
    if (existing) {
      // Generic message — no user enumeration
      throw new AppError(400, 'INVALID_CREDENTIALS', 'Could not create account with those details');
    }
    const passwordHash = await argon2.hash(password);
    const user = await userRepo.createFullUser(email, passwordHash);
    const accessToken = signAccessToken(user.id, false);
    const { raw, hash, expiresAt } = signRefreshToken();
    await userRepo.storeRefreshToken(user.id, hash, expiresAt);
    res.cookie(REFRESH_COOKIE_NAME, raw, refreshCookieOptions());
    res.status(201).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginBodySchema.parse(req.body);
    const dbUser = await userRepo.findUserByEmail(email);
    // Generic error — no user enumeration
    const GENERIC_ERROR = new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    if (!dbUser || !dbUser.passwordHash) throw GENERIC_ERROR;
    const valid = await argon2.verify(dbUser.passwordHash, password);
    if (!valid) throw GENERIC_ERROR;

    await userRepo.touchLastActive(dbUser.id);
    const accessToken = signAccessToken(dbUser.id, dbUser.isGuest);
    const { raw, hash, expiresAt } = signRefreshToken();
    await userRepo.storeRefreshToken(dbUser.id, hash, expiresAt);
    res.cookie(REFRESH_COOKIE_NAME, raw, refreshCookieOptions());
    res.json({ accessToken, user: { id: dbUser.id, email: dbUser.email, isGuest: dbUser.isGuest, createdAt: dbUser.createdAt.toISOString() } });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!raw) throw new AppError(401, 'UNAUTHORIZED', 'No refresh token');

    const tokenHash = hashRefreshToken(raw);
    const stored = await userRepo.findValidRefreshToken(tokenHash);
    if (!stored) throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');

    // Rotate: revoke old, issue new
    await userRepo.revokeRefreshToken(tokenHash);
    const user = await userRepo.findUserById(stored.userId);
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'User not found');

    const newAccessToken = signAccessToken(user.id, user.isGuest);
    const { raw: newRaw, hash: newHash, expiresAt } = signRefreshToken();
    await userRepo.storeRefreshToken(user.id, newHash, expiresAt);
    res.cookie(REFRESH_COOKIE_NAME, newRaw, refreshCookieOptions());
    res.json({ accessToken: newAccessToken, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────
authRouter.post('/logout', async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (raw) {
      const tokenHash = hashRefreshToken(raw);
      await userRepo.revokeRefreshToken(tokenHash);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/upgrade ────────────────────────────────────────────────
authRouter.post('/upgrade', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    if (!req.user!.isGuest) {
      throw new AppError(400, 'ALREADY_REGISTERED', 'Account is already a full account');
    }
    const { email, password } = UpgradeBodySchema.parse(req.body);
    const existing = await userRepo.findUserByEmail(email);
    if (existing) {
      throw new AppError(400, 'INVALID_CREDENTIALS', 'Could not upgrade with those details');
    }
    const passwordHash = await argon2.hash(password);
    const user = await userRepo.upgradeGuestToFullUser(userId, email, passwordHash);
    // Invalidate old tokens and issue new ones
    await userRepo.revokeAllUserRefreshTokens(userId);
    const accessToken = signAccessToken(user.id, false);
    const { raw, hash, expiresAt } = signRefreshToken();
    await userRepo.storeRefreshToken(user.id, hash, expiresAt);
    res.cookie(REFRESH_COOKIE_NAME, raw, refreshCookieOptions());
    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
});
