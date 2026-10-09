export interface ClaimedRewardDto {
  claimId: string;
  checkpointId: string;
  rewardName: string;
  /** ISO 8601, UTC. */
  claimedAt: string;
  /** Unchanged by the claim; rewards do not cost points. */
  totalScore: number;
  progressVersion: number;
}
