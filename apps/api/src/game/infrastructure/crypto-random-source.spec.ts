import { pickScore, SCORE_OPTIONS } from '../domain/game-rules.js';
import { CryptoRandomSource } from './crypto-random-source.js';

describe('CryptoRandomSource', () => {
  it('returns integers within [0, max)', () => {
    const random = new CryptoRandomSource();
    for (let i = 0; i < 1000; i++) {
      const value = random.int(4);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(4);
    }
  });

  it('picks every score option with roughly equal frequency', () => {
    const random = new CryptoRandomSource();
    const draws = 20000;
    const counts = new Map<number, number>(SCORE_OPTIONS.map((score) => [score, 0]));
    for (let i = 0; i < draws; i++) {
      const score = pickScore(random);
      counts.set(score, (counts.get(score) ?? 0) + 1);
    }
    // Expected 5,000 each; ±10% is far outside normal sampling variation (~±0.7%).
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(4500);
      expect(count).toBeLessThan(5500);
    }
  });
});
