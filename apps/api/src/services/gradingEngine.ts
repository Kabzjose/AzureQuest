import type { OptionFull, GradeResult, MistakeType } from '@azurequest/shared';

/**
 * Grading engine — purely functional, no DB calls, fully unit-tested.
 *
 * Rules:
 *  - Single-select: score 1 if correct, 0 otherwise.
 *  - Multi-select:  partialScore = (correct_selected − wrong_selected) / total_correct, floored at 0.
 *  - isCorrect = partialScore === 1 (all correct, none wrong).
 */

export interface GradeInput {
  options: OptionFull[];
  selectedOptionIds: string[];
  type: 'single' | 'multi';
}

export function gradeDecision(input: GradeInput): GradeResult {
  const { options, selectedOptionIds, type } = input;
  const selectedSet = new Set(selectedOptionIds);

  const correctOptions = options.filter((o) => o.isCorrect);
  const correctOptionIds = new Set(correctOptions.map((o) => o.id));

  // Count selected correct and selected wrong
  let correctSelected = 0;
  let wrongSelected = 0;
  for (const id of selectedOptionIds) {
    if (correctOptionIds.has(id)) correctSelected++;
    else wrongSelected++;
  }

  let partialScore: number;
  if (type === 'single') {
    // Single-select: full credit or nothing
    partialScore = selectedOptionIds.length === 1 && correctOptionIds.has(selectedOptionIds[0]) ? 1 : 0;
  } else {
    // Multi-select: partial credit, floored at 0
    const totalCorrect = correctOptions.length;
    partialScore = totalCorrect === 0 ? 0 : Math.max(0, (correctSelected - wrongSelected) / totalCorrect);
  }

  const isCorrect = partialScore === 1;

  // Collect mistake tags from wrong selected options
  const mistakeTags: MistakeType[] = [];
  for (const option of options) {
    if (selectedSet.has(option.id) && !option.isCorrect && option.mistakeType) {
      mistakeTags.push(option.mistakeType);
    }
  }

  // Per-option results (revealed after submission)
  const optionResults = options.map((o) => ({
    optionId: o.id,
    isCorrect: o.isCorrect,
    feedback: o.feedback,
    consequence: o.consequence,
    wasSelected: selectedSet.has(o.id),
  }));

  // Concepts to revise: from wrong-selected options with confusedWithConceptId
  // (resolved by caller with concept data)
  const conceptsToRevise: GradeResult['conceptsToRevise'] = [];

  return {
    isCorrect,
    partialScore,
    mistakeTags,
    optionResults,
    conceptsToRevise,
  };
}

// Re-export the type so callers can import from here
export type { GradeResult };
