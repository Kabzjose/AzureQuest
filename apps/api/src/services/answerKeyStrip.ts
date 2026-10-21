/**
 * Strip answer keys (isCorrect, mistakeType, confusedWithConceptId) from options
 * before sending to the client. This is enforced server-side; the client
 * never receives the answer key before submission.
 */

import type { OptionFull, OptionPublic, DecisionFull, DecisionPublic, ScenarioFull, ScenarioPublic } from '@azurequest/shared';

export function stripOption(option: OptionFull): OptionPublic {
  // Explicitly destructure and omit the answer-key fields
  const { isCorrect: _isCorrect, mistakeType: _mistakeType, confusedWithConceptId: _cfcId, ...pub } = option;
  return pub;
}

export function stripDecision(decision: DecisionFull): DecisionPublic {
  return {
    ...decision,
    options: decision.options.map(stripOption),
  };
}

export function stripScenario(scenario: ScenarioFull): ScenarioPublic {
  return {
    ...scenario,
    decisions: scenario.decisions.map(stripDecision),
  };
}
