import { describe, it, expect } from 'vitest';
import { recencyWeightedAccuracy, computeDomainScore, computeReadiness } from '../../src/services/readinessService';
import type { DomainResponseSummary } from '../../src/services/readinessService';

describe('recencyWeightedAccuracy', () => {
  it('returns 0 for empty array', () => {
    expect(recencyWeightedAccuracy([])).toBe(0);
  });

  it('returns exact score for single value', () => {
    expect(recencyWeightedAccuracy([0.8])).toBe(0.8);
  });

  it('weights more recent scores higher', () => {
    // [0, 1] — second score (weight 2) should dominate
    const result = recencyWeightedAccuracy([0, 1]);
    // expected: (1*0 + 2*1) / (1+2) = 2/3
    expect(result).toBeCloseTo(2 / 3);
  });

  it('weights most recent highest in longer sequence', () => {
    const highRecent = recencyWeightedAccuracy([0, 0, 0, 1]);
    const highOld = recencyWeightedAccuracy([1, 0, 0, 0]);
    // Recent 1 should give a higher score than old 1
    expect(highRecent).toBeGreaterThan(highOld);
  });
});

describe('computeDomainScore', () => {
  it('returns null score when fewer than 8 responses', () => {
    const summary: DomainResponseSummary = {
      domain: 'cloud-concepts',
      scores: [1, 1, 1, 1, 1],
    };
    const result = computeDomainScore(summary);
    expect(result.score).toBeNull();
    expect(result.answeredCount).toBe(5);
  });

  it('returns score when 8+ responses', () => {
    const summary: DomainResponseSummary = {
      domain: 'cloud-concepts',
      scores: [1, 1, 1, 1, 1, 1, 1, 1],
    };
    const result = computeDomainScore(summary);
    expect(result.score).not.toBeNull();
    expect(result.score).toBeCloseTo(1);
  });

  it('uses only last 20 responses', () => {
    const summary: DomainResponseSummary = {
      domain: 'cloud-concepts',
      scores: Array(30).fill(0).concat([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
    };
    const result = computeDomainScore(summary);
    // Only the last 20 (all 1s) should count
    expect(result.score).toBeCloseTo(1);
    expect(result.answeredCount).toBe(20);
  });
});

describe('computeReadiness', () => {
  it('returns "Not enough data" when any domain has insufficient responses', () => {
    const summaries: DomainResponseSummary[] = [
      { domain: 'cloud-concepts', scores: [1, 1, 1, 1, 1, 1, 1, 1] },
      { domain: 'architecture-services', scores: [1, 1, 1] },  // insufficient
      { domain: 'management-governance', scores: [1, 1, 1, 1, 1, 1, 1, 1] },
    ];
    const result = computeReadiness(summaries);
    expect(result.label).toBe('Not enough data');
    expect(result.overall).toBeNull();
  });

  it('returns "Looking strong" when all domains >= 65% and overall >= 75%', () => {
    const goodScores = Array(10).fill(1);
    const summaries: DomainResponseSummary[] = [
      { domain: 'cloud-concepts', scores: goodScores },
      { domain: 'architecture-services', scores: goodScores },
      { domain: 'management-governance', scores: goodScores },
    ];
    const result = computeReadiness(summaries);
    expect(result.label).toBe('Looking strong');
    expect(result.overall).not.toBeNull();
    expect(result.overall!).toBeGreaterThanOrEqual(75);
  });

  it('returns "Keep practising" when overall < 60%', () => {
    const badScores = Array(10).fill(0);
    const summaries: DomainResponseSummary[] = [
      { domain: 'cloud-concepts', scores: badScores },
      { domain: 'architecture-services', scores: badScores },
      { domain: 'management-governance', scores: badScores },
    ];
    const result = computeReadiness(summaries);
    expect(result.label).toBe('Keep practising');
  });

  it('always includes the disclaimer', () => {
    const summaries: DomainResponseSummary[] = [
      { domain: 'cloud-concepts', scores: [] },
      { domain: 'architecture-services', scores: [] },
      { domain: 'management-governance', scores: [] },
    ];
    const result = computeReadiness(summaries);
    expect(result.disclaimer).toBe('This is a practice-based estimate, not a prediction of your official exam result.');
  });
});
