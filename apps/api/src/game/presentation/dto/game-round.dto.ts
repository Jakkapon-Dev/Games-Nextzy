export interface PlayedRoundDto {
  roundId: string;
  pickedScore: number;
  creditedScore: number;
  totalScore: number;
  progressVersion: number;
  /** ISO 8601, UTC. */
  createdAt: string;
}

export interface GameHistoryItemDto {
  roundId: string;
  pickedScore: number;
  creditedScore: number;
  totalScoreAfter: number;
  /** ISO 8601, UTC. */
  createdAt: string;
}
