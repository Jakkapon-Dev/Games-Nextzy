/** Types of the Nextzy points game API (base path /api). Timestamps are ISO 8601 UTC strings. */

export type CheckpointStatus = 'LOCKED' | 'CLAIMABLE' | 'CLAIMED';

export interface PlayerSession {
  playerId: string;
  totalScore: number;
  progressVersion: number;
}

export interface Checkpoint {
  id: string;
  requiredScore: number;
  rewardName: string;
  status: CheckpointStatus;
}

export interface PlayerProgress {
  totalScore: number;
  maxScore: number;
  progressVersion: number;
  scoreOptions: number[];
  checkpoints: Checkpoint[];
}

export interface PlayedRound {
  roundId: string;
  pickedScore: number;
  creditedScore: number;
  totalScore: number;
  progressVersion: number;
  createdAt: string;
}

export interface ClaimedReward {
  claimId: string;
  checkpointId: string;
  rewardName: string;
  claimedAt: string;
  totalScore: number;
  progressVersion: number;
}

export interface ProgressReset {
  totalScore: number;
  progressVersion: number;
  resetAt: string;
}

export interface GameHistoryItem {
  roundId: string;
  pickedScore: number;
  creditedScore: number;
  totalScoreAfter: number;
  createdAt: string;
}

export interface RewardHistoryItem {
  claimId: string;
  checkpointId: string;
  rewardName: string;
  claimedAt: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
}

export interface PageQuery {
  page?: number;
  limit?: number;
}

export interface ErrorBody {
  code: string;
  message: string;
}
