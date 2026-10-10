import type { Player } from '../../player/domain/player.js';
import type { Checkpoint, Claim, Round } from '../domain/progress.js';

/** All methods are scoped to the locked player and the same transaction. */
export interface ProgressTransaction {
  player: Player | null;
  findRound(progressVersion: number, requestId: string): Promise<Round | null>;
  createRound(round: Omit<Round, 'id' | 'playerId' | 'createdAt'>): Promise<Round>;
  setTotalScore(totalScore: number): Promise<void>;
  findCheckpoint(id: string): Promise<Checkpoint | null>;
  findClaim(progressVersion: number, checkpointId: string): Promise<Claim | null>;
  createClaim(progressVersion: number, checkpointId: string): Promise<Claim>;
  clearHistory(): Promise<void>;
  resetPlayer(totalScore: number, progressVersion: number): Promise<Player & { updatedAt: Date }>;
}

export interface ProgressUnitOfWork {
  /** Serializes mutations for one player, commits on success and rolls back on error. */
  withLockedPlayer<T>(playerId: string, work: (tx: ProgressTransaction) => Promise<T>): Promise<T>;
}
