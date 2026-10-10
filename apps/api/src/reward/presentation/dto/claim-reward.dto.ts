import { IsInt, Min } from 'class-validator';

const INVALID_REQUEST = 'progressVersion ต้องเป็นจำนวนเต็มตั้งแต่ 1';

export class ClaimRewardDto {
  @IsInt({ message: INVALID_REQUEST })
  @Min(1, { message: INVALID_REQUEST })
  progressVersion!: number;
}
