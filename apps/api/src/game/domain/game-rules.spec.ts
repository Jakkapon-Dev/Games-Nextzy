import {
  checkpointStatus,
  creditedScore,
  MAX_SCORE,
  pickScore,
  RandomSource,
  SCORE_OPTIONS,
} from './game-rules.js';

const fixed = (index: number): RandomSource => ({ int: () => index });

describe('game rules', () => {
  it('defines the score cap and the four score options', () => {
    expect(MAX_SCORE).toBe(10000);
    expect(SCORE_OPTIONS).toEqual([300, 500, 1000, 3000]);
  });

  describe('pickScore', () => {
    it.each([
      [0, 300],
      [1, 500],
      [2, 1000],
      [3, 3000],
    ])('maps random index %i to %i', (index, score) => {
      expect(pickScore(fixed(index))).toBe(score);
    });

    it('asks the random source for an index across all options', () => {
      const calls: number[] = [];
      pickScore({ int: (max) => (calls.push(max), 0) });
      expect(calls).toEqual([SCORE_OPTIONS.length]);
    });

    it('rejects an index outside the options', () => {
      expect(() => pickScore(fixed(4))).toThrow(RangeError);
    });
  });

  describe('creditedScore', () => {
    it.each([
      [0, 3000, 3000],
      [6000, 1000, 1000],
      [9500, 3000, 500],
      [9700, 300, 300],
      [9800, 300, 200],
      [10000, 500, 0],
    ])('total %i + picked %i credits %i', (total, picked, credited) => {
      expect(creditedScore(total, picked)).toBe(credited);
    });
  });

  describe('checkpointStatus', () => {
    it.each([
      [0, 5000, 'LOCKED'],
      [4999, 5000, 'LOCKED'],
      [5000, 5000, 'CLAIMABLE'],
      [8500, 7500, 'CLAIMABLE'],
      [8500, 10000, 'LOCKED'],
      [10000, 10000, 'CLAIMABLE'],
    ] as const)('score %i with required %i is %s when not claimed', (score, required, status) => {
      expect(checkpointStatus(score, required, false)).toBe(status);
    });

    it('is CLAIMED once claimed, regardless of score', () => {
      expect(checkpointStatus(10000, 5000, true)).toBe('CLAIMED');
      expect(checkpointStatus(0, 5000, true)).toBe('CLAIMED');
    });
  });
});
