import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { scenariosRouter } from './routes/scenarios';
import { conceptsRouter } from './routes/concepts';
import { attemptsRouter } from './routes/attempts';
import { progressRouter } from './routes/progress';
import { flashcardsRouter } from './routes/flashcards';
import { tutorRouter } from './routes/tutor';

export function buildApp() {
  const app = express();

  // ── Security headers ─────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ─────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.use(cors({
    origin: (origin, cb) => {
      // Allow server-to-server requests (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,   // required for refresh token cookie
  }));

  // ── Body parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // ── Request logging ───────────────────────────────────────────────────────
  app.use(pinoHttp({ logger }));

  // ── Global rate limit (generous, stricter limits per route) ───────────────
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later.' } },
  }));

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/concepts', conceptsRouter);
  app.use('/api/scenarios', scenariosRouter);
  app.use('/api/attempts', attemptsRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/flashcards', flashcardsRouter);
  app.use('/api/tutor', tutorRouter);

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // ── Centralised error handler ─────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}

export const app = buildApp();
