import { describe, expect, it } from 'vitest';
import { formatScore, formatThaiDateTime, toPercent } from './format';

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

describe('formatThaiDateTime', () => {
  it('shows the time in Thailand (UTC+7) as DD/MM/YY HH:mm น.', () => {
    expect(formatThaiDateTime('2025-02-15T13:00:00.000Z')).toBe('15/02/25 20:00 น.');
  });

  it('rolls over to the next day after 17:00 UTC', () => {
    expect(formatThaiDateTime('2026-10-09T17:30:00.000Z')).toBe('10/10/26 00:30 น.');
  });
});
