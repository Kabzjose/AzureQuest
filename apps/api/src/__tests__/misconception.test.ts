import { describe, it, expect } from 'vitest';
import { makePairKey } from '../../src/repositories/attemptRepository';

describe('makePairKey', () => {
  it('produces the same key regardless of argument order', () => {
    const a = 'aaaaaaaa-0000-0000-0000-000000000001';
    const b = 'aaaaaaaa-0000-0000-0000-000000000002';
    expect(makePairKey(a, b)).toBe(makePairKey(b, a));
  });

  it('puts the smaller UUID first', () => {
    const a = 'aaaaaaaa-0000-0000-0000-000000000001';
    const b = 'aaaaaaaa-0000-0000-0000-000000000002';
    const key = makePairKey(a, b);
    expect(key.startsWith(a)).toBe(true);
    expect(key.endsWith(b)).toBe(true);
  });

  it('uses pipe as separator', () => {
    const a = 'aaaaaaaa-0000-0000-0000-000000000001';
    const b = 'aaaaaaaa-0000-0000-0000-000000000002';
    const key = makePairKey(a, b);
    expect(key).toContain('|');
    expect(key.split('|')).toHaveLength(2);
  });
});
