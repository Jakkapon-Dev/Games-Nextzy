import { DomainError } from '../../shared/domain/domain-error.js';
import type { ProgressUnitOfWork } from '../../shared/application/progress-unit-of-work.js';
import type { Round } from '../../shared/domain/progress.js';
import { creditedScore, pickScore, type RandomSource } from '../domain/game-rules.js';

export interface PlayRoundRequest {
  requestId: string;
  progressVersion: number;
}

function result(round: Round) {
  return {
    roundId: round.id,
    pickedScore: round.pickedScore,
    creditedScore: round.creditedScore,
    totalScore: round.totalScoreAfter,
    progressVersion: round.progressVersion,
    createdAt: round.createdAt.toISOString(),
  };
}

export class PlayGameRound {
  constructor(
    private readonly transactions: ProgressUnitOfWork,
    private readonly random: RandomSource,
  ) {}

  execute(playerId: string, request: PlayRoundRequest) {
    return this.transactions.withLockedPlayer(playerId, async (tx) => {
      const player = tx.player;
      if (!player) throw new DomainError('SESSION_REQUIRED');
      // A retry returns its original result before checking the current version.
      const existing = await tx.findRound(request.progressVersion, request.requestId);
      if (existing) return result(existing);
      if (request.progressVersion !== player.progressVersion)
        throw new DomainError('PROGRESS_VERSION_MISMATCH');
      const picked = pickScore(this.random);
      const credited = creditedScore(player.totalScore, picked);
      const totalScoreAfter = player.totalScore + credited;
      const round = await tx.createRound({
        requestId: request.requestId,
        progressVersion: player.progressVersion,
        pickedScore: picked,
        creditedScore: credited,
        totalScoreAfter,
      });
      await tx.setTotalScore(totalScoreAfter);
      return result(round);
    });
  }
}
