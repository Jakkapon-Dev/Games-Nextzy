import { checkpointStatus, MAX_SCORE, SCORE_OPTIONS } from './game-rules.js';

describe('game rules', () => {
  it('defines the score cap and the four score options', () => {
    expect(MAX_SCORE).toBe(10000);
    expect(SCORE_OPTIONS).toEqual([300, 500, 1000, 3000]);
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
