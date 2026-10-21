import { describe, it, expect } from 'vitest';
import { stripOption, stripDecision } from '../../src/services/answerKeyStrip';
import type { OptionFull, DecisionFull } from '@azurequest/shared';
import { v4 as uuidv4 } from 'uuid';

describe('answerKeyStrip', () => {
  const fullOption: OptionFull = {
    id: uuidv4(),
    label: 'Choose App Service',
    isCorrect: true,
    feedback: 'This is the right choice because...',
    consequence: 'The app scales automatically',
    mistakeType: undefined,
    confusedWithConceptId: undefined,
  };

  const wrongOption: OptionFull = {
    id: uuidv4(),
    label: 'Choose VM',
    isCorrect: false,
    feedback: 'This adds too much management overhead',
    consequence: 'The team spends weeks on VM setup',
    mistakeType: 'service-mixup',
    confusedWithConceptId: uuidv4(),
  };

  describe('stripOption', () => {
    it('removes isCorrect from the stripped option', () => {
      const stripped = stripOption(fullOption);
      expect('isCorrect' in stripped).toBe(false);
    });

    it('removes mistakeType from the stripped option', () => {
      const stripped = stripOption(wrongOption);
      expect('mistakeType' in stripped).toBe(false);
    });

    it('removes confusedWithConceptId from the stripped option', () => {
      const stripped = stripOption(wrongOption);
      expect('confusedWithConceptId' in stripped).toBe(false);
    });

    it('preserves label, feedback, consequence, and id', () => {
      const stripped = stripOption(fullOption);
      expect(stripped.id).toBe(fullOption.id);
      expect(stripped.label).toBe(fullOption.label);
      expect(stripped.feedback).toBe(fullOption.feedback);
      expect(stripped.consequence).toBe(fullOption.consequence);
    });
  });

  describe('stripDecision', () => {
    const decision: DecisionFull = {
      id: uuidv4(),
      prompt: 'Which service should you choose?',
      type: 'single',
      options: [fullOption, wrongOption],
    };

    it('strips all options in the decision', () => {
      const stripped = stripDecision(decision);
      for (const opt of stripped.options) {
        expect('isCorrect' in opt).toBe(false);
        expect('mistakeType' in opt).toBe(false);
        expect('confusedWithConceptId' in opt).toBe(false);
      }
    });

    it('preserves decision metadata', () => {
      const stripped = stripDecision(decision);
      expect(stripped.id).toBe(decision.id);
      expect(stripped.prompt).toBe(decision.prompt);
      expect(stripped.type).toBe(decision.type);
      expect(stripped.options).toHaveLength(2);
    });
  });
});
