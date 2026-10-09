/** Game rules. Pure functions with no framework or database dependencies. */

export const MAX_SCORE = 10000;

export const SCORE_OPTIONS = [300, 500, 1000, 3000] as const;

export type ScoreOption = (typeof SCORE_OPTIONS)[number];

export type CheckpointStatus = 'LOCKED' | 'CLAIMABLE' | 'CLAIMED';

/** Source of uniformly distributed integers, injected so tests can control the result. */
export interface RandomSource {
  /** Returns an integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
}

/** Picks one score option with equal probability. */
export function pickScore(random: RandomSource): ScoreOption {
  const index = random.int(SCORE_OPTIONS.length);
  const score = SCORE_OPTIONS[index];
  if (score === undefined) {
    throw new RangeError(`Random index ${index} is outside the score options`);
  }
  return score;
}

/** Points actually added so the total never exceeds MAX_SCORE. */
export function creditedScore(totalScore: number, pickedScore: number): number {
  return Math.max(0, Math.min(pickedScore, MAX_SCORE - totalScore));
}

/** A checkpoint is claimable once the total score reaches its required score. */
export function checkpointStatus(
  totalScore: number,
  requiredScore: number,
  claimed: boolean,
): CheckpointStatus {
  if (claimed) return 'CLAIMED';
  return totalScore >= requiredScore ? 'CLAIMABLE' : 'LOCKED';
}
