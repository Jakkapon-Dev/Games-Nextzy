/** Game rules. Pure functions with no framework or database dependencies. */

export const MAX_SCORE = 10000;

export const SCORE_OPTIONS = [300, 500, 1000, 3000] as const;

export type CheckpointStatus = 'LOCKED' | 'CLAIMABLE' | 'CLAIMED';

/** A checkpoint is claimable once the total score reaches its required score. */
export function checkpointStatus(
  totalScore: number,
  requiredScore: number,
  claimed: boolean,
): CheckpointStatus {
  if (claimed) return 'CLAIMED';
  return totalScore >= requiredScore ? 'CLAIMABLE' : 'LOCKED';
}
