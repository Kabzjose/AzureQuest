/**
 * Readiness estimate service.
 *
 * Algorithm (deterministic, unit-tested):
 * 1. Fetch the last 20 VERIFIED decision responses per domain for this user.
 * 2. Apply recency weighting: most recent response has weight N, oldest weight 1.
 * 3. Weighted accuracy = sum(weight_i * score_i) / sum(weight_i).
 * 4. Require >= 8 responses per domain for a score (otherwise null = "Not enough data").
 * 5. Overall = weighted sum of domain scores using AZ-900 domain weight midpoints, normalised to 100.
 */

import type { DomainScore, ReadinessLabel, Readiness, Domain } from '@azurequest/shared';
import { DOMAIN_WEIGHTS } from '@azurequest/shared';

const DOMAINS: Domain[] = ['cloud-concepts', 'architecture-services', 'management-governance'];
const MIN_RESPONSES_PER_DOMAIN = 8;
const MAX_RESPONSES_PER_DOMAIN = 20;

export interface DomainResponseSummary {
  domain: Domain;
  /** Responses in chronological order (oldest first) — verified only */
  scores: number[];  // partialScore values
}

/**
 * Compute a recency-weighted accuracy score.
 * Weight of the i-th response (0 = oldest) = i + 1.
 */
export function recencyWeightedAccuracy(scores: number[]): number {
  if (scores.length === 0) return 0;
  const n = scores.length;
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < n; i++) {
    const weight = i + 1;
    weightedSum += weight * scores[i];
    totalWeight += weight;
  }
  return weightedSum / totalWeight;
}

export function computeDomainScore(summary: DomainResponseSummary): DomainScore {
  const recent = summary.scores.slice(-MAX_RESPONSES_PER_DOMAIN);
  const score = recent.length >= MIN_RESPONSES_PER_DOMAIN
    ? recencyWeightedAccuracy(recent)
    : null;
  return {
    domain: summary.domain,
    score,
    answeredCount: recent.length,
    weight: DOMAIN_WEIGHTS[summary.domain],
  };
}

const READINESS_DISCLAIMER = 'This is a practice-based estimate, not a prediction of your official exam result.' as const;

export function computeReadiness(domainSummaries: DomainResponseSummary[]): Readiness {
  const domainScores = domainSummaries.map(computeDomainScore);
  const allHaveData = domainScores.every((d) => d.score !== null);

  let overall: number | null = null;
  let label: ReadinessLabel = 'Not enough data';

  if (allHaveData) {
    // Weighted sum, normalised — midpoints sum to 97.5, close enough to 100
    const weightedSum = domainScores.reduce((sum, d) => {
      return sum + (d.score! * d.weight.midpoint);
    }, 0);
    const totalMidpoints = DOMAINS.reduce((sum, d) => sum + DOMAIN_WEIGHTS[d].midpoint, 0); // 97.5
    overall = (weightedSum / totalMidpoints) * 100;

    // Label logic
    if (overall >= 75 && domainScores.every((d) => (d.score ?? 0) >= 0.65)) {
      label = 'Looking strong';
    } else if (overall >= 60) {
      label = 'Almost there';
    } else {
      label = 'Keep practising';
    }
  }

  return {
    overall,
    label,
    domains: domainScores,
    disclaimer: READINESS_DISCLAIMER,
  };
}
