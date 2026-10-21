import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { DomainSchema } from '@azurequest/shared';
import { findPublishedScenarios, findScenarioById } from '../repositories/scenarioRepository';
import { stripScenario } from '../services/answerKeyStrip';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

export const scenariosRouter = Router();

// GET /api/scenarios?domain=...&difficulty=...
scenariosRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const QuerySchema = z.object({
      domain: DomainSchema.optional(),
      difficulty: z.coerce.number().int().min(1).max(3).optional(),
    });
    const { domain, difficulty } = QuerySchema.parse(req.query);
    const scenarios = await findPublishedScenarios({ domain, difficulty });
    // Strip answer keys before returning
    res.json({ scenarios: scenarios.map(stripScenario) });
  } catch (err) {
    next(err);
  }
});

// GET /api/scenarios/:id
scenariosRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const scenario = await findScenarioById(req.params.id);
    if (!scenario) throw new AppError(404, 'NOT_FOUND', 'Scenario not found');
    // Strip answer keys
    res.json({ scenario: stripScenario(scenario) });
  } catch (err) {
    next(err);
  }
});
