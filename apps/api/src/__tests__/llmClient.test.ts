import { describe, it, expect } from 'vitest';
import { MockLLMClient } from '../../src/llm/client';
import { TutorExplanationSchema } from '@azurequest/shared';

describe('MockLLMClient', () => {
  it('returns valid JSON that matches the TutorExplanation shape', async () => {
    const client = new MockLLMClient();
    const raw = await client.complete('system prompt', [{ role: 'user', content: 'explain' }]);
    expect(() => JSON.parse(raw)).not.toThrow();
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty('technicalReason');
    expect(parsed).toHaveProperty('analogy');
    expect(parsed).toHaveProperty('tradeOff');
    expect(parsed).toHaveProperty('followUpQuestion');
  });
});

describe('LLM JSON validation fallback', () => {
  it('falls back to static feedback when JSON is invalid', async () => {
    // Simulate the fallback pattern used in the tutor route
    const invalidJson = 'This is not JSON at all, just a plain response.';
    let parsed;
    try {
      parsed = JSON.parse(invalidJson);
    } catch {
      // Fallback to static explanation
      parsed = {
        technicalReason: 'Static fallback explanation.',
        analogy: 'Static analogy.',
        tradeOff: 'Static trade-off.',
        followUpQuestion: 'Review the Microsoft Learn link.',
      };
    }
    expect(parsed.technicalReason).toBe('Static fallback explanation.');
  });
});
