/** Application-owned player snapshot; independent of persistence and HTTP. */
export interface Player {
  id: string;
  totalScore: number;
  progressVersion: number;
}
