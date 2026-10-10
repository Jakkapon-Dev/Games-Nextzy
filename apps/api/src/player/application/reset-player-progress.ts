import { DomainError } from '../../shared/domain/domain-error.js';
import type { ProgressUnitOfWork } from '../../shared/application/progress-unit-of-work.js';

export class ResetPlayerProgress {
  constructor(private readonly transactions: ProgressUnitOfWork) {}

  execute(playerId: string, request: { progressVersion: number }) {
    return this.transactions.withLockedPlayer(playerId, async (tx) => {
      const player = tx.player;
      if (!player) throw new DomainError('SESSION_REQUIRED');
      if (request.progressVersion !== player.progressVersion)
        throw new DomainError('PROGRESS_VERSION_MISMATCH');
      await tx.clearHistory();
      const updated = await tx.resetPlayer(0, player.progressVersion + 1);
      return {
        totalScore: updated.totalScore,
        progressVersion: updated.progressVersion,
        resetAt: updated.updatedAt.toISOString(),
      };
    });
  }
}
