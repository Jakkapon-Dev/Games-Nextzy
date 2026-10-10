import { describe, expect, it } from 'vitest';
import { formatScore, toPercent } from './format';

describe('formatScore', () => {
  it('adds thousands separators', () => {
    expect(formatScore(0)).toBe('0');
    expect(formatScore(8500)).toBe('8,500');
    expect(formatScore(10000)).toBe('10,000');
  });
});

describe('toPercent', () => {
  it('converts a value to a percentage of the maximum', () => {
    expect(toPercent(5000, 10000)).toBe(50);
    expect(toPercent(7500, 10000)).toBe(75);
  });

  it('clamps to 0–100 and handles a zero maximum', () => {
    expect(toPercent(-1, 10000)).toBe(0);
    expect(toPercent(12000, 10000)).toBe(100);
    expect(toPercent(5, 0)).toBe(0);
  });
});
