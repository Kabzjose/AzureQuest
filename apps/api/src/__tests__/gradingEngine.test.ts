import { describe, it, expect } from 'vitest';
import { gradeDecision } from '../../src/services/gradingEngine';
import type { OptionFull } from '@azurequest/shared';

function makeOption(id: string, isCorrect: boolean, overrides: Partial<OptionFull> = {}): OptionFull {
  return {
    id,
    label: `Option ${id}`,
    isCorrect,
    feedback: `Feedback for ${id}`,
    consequence: `Consequence for ${id}`,
    mistakeType: isCorrect ? undefined : 'service-mixup',
    confusedWithConceptId: undefined,
    ...overrides,
  };
}

describe('gradeDecision — single select', () => {
  const options: OptionFull[] = [
    makeOption('a', true),
    makeOption('b', false),
    makeOption('c', false),
  ];

  it('gives full credit for the correct option', () => {
    const result = gradeDecision({ options, selectedOptionIds: ['a'], type: 'single' });
    expect(result.isCorrect).toBe(true);
    expect(result.partialScore).toBe(1);
    expect(result.mistakeTags).toHaveLength(0);
  });

  it('gives zero credit for a wrong option', () => {
    const result = gradeDecision({ options, selectedOptionIds: ['b'], type: 'single' });
    expect(result.isCorrect).toBe(false);
    expect(result.partialScore).toBe(0);
    expect(result.mistakeTags).toContain('service-mixup');
  });

  it('reveals all option results after submission', () => {
    const result = gradeDecision({ options, selectedOptionIds: ['a'], type: 'single' });
    expect(result.optionResults).toHaveLength(3);
    const correct = result.optionResults.find(r => r.optionId === 'a');
    expect(correct?.wasSelected).toBe(true);
    expect(correct?.isCorrect).toBe(true);
    const wrong = result.optionResults.find(r => r.optionId === 'b');
    expect(wrong?.wasSelected).toBe(false);
  });
});

describe('gradeDecision — multi select', () => {
  const options: OptionFull[] = [
    makeOption('a', true),
    makeOption('b', true),
    makeOption('c', false),
    makeOption('d', false),
  ];

  it('gives full credit when all correct and no wrong are selected', () => {
    const result = gradeDecision({ options, selectedOptionIds: ['a', 'b'], type: 'multi' });
    expect(result.isCorrect).toBe(true);
    expect(result.partialScore).toBe(1);
  });

  it('gives partial credit: (correct_selected - wrong_selected) / total_correct', () => {
    // 1 correct, 0 wrong → 1/2 = 0.5
    const result = gradeDecision({ options, selectedOptionIds: ['a'], type: 'multi' });
    expect(result.partialScore).toBeCloseTo(0.5);
    expect(result.isCorrect).toBe(false);
  });

  it('floors partial score at 0 when wrong selections exceed correct ones', () => {
    // 0 correct, 2 wrong → (0-2)/2 = -1 → floored at 0
    const result = gradeDecision({ options, selectedOptionIds: ['c', 'd'], type: 'multi' });
    expect(result.partialScore).toBe(0);
    expect(result.isCorrect).toBe(false);
  });

  it('partial credit: 1 correct + 1 wrong = (1-1)/2 = 0', () => {
    const result = gradeDecision({ options, selectedOptionIds: ['a', 'c'], type: 'multi' });
    expect(result.partialScore).toBe(0);
  });

  it('collects mistake tags from all selected wrong options', () => {
    const result = gradeDecision({ options, selectedOptionIds: ['c', 'd'], type: 'multi' });
    expect(result.mistakeTags).toContain('service-mixup');
    expect(result.mistakeTags.length).toBe(2);
  });
});
