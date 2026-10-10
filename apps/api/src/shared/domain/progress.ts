export interface Round {
  id: string;
  playerId: string;
  requestId: string;
  progressVersion: number;
  pickedScore: number;
  creditedScore: number;
  totalScoreAfter: number;
  createdAt: Date;
}

export interface Checkpoint {
  id: string;
  requiredScore: number;
  rewardName: string;
}

export interface Claim {
  id: string;
  playerId: string;
  checkpointId: string;
  progressVersion: number;
  claimedAt: Date;
}
