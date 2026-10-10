import type { CheckpointStatus } from '../../../game/domain/game-rules.js';

export interface CheckpointDto {
  id: string;
  requiredScore: number;
  rewardName: string;
  status: CheckpointStatus;
}

export interface PlayerProgressDto {
  totalScore: number;
  maxScore: number;
  progressVersion: number;
  scoreOptions: number[];
  checkpoints: CheckpointDto[];
}
