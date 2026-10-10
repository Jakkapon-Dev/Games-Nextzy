import { IsInt, Min } from 'class-validator';

const INVALID_REQUEST = 'progressVersion ต้องเป็นจำนวนเต็มตั้งแต่ 1';

export class ResetProgressDto {
  @IsInt({ message: INVALID_REQUEST })
  @Min(1, { message: INVALID_REQUEST })
  progressVersion!: number;
}

export interface ProgressResetDto {
  totalScore: number;
  progressVersion: number;
  /** ISO 8601, UTC. */
  resetAt: string;
}
