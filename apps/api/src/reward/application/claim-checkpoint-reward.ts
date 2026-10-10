import { DomainError } from '../../shared/domain/domain-error.js';
import { checkpointStatus } from '../../game/domain/game-rules.js';
import type { ProgressUnitOfWork } from '../../shared/application/progress-unit-of-work.js';

export class ClaimCheckpointReward {
  constructor(private readonly transactions: ProgressUnitOfWork) {}

  execute(playerId: string, checkpointId: string, request: { progressVersion: number }) {
    return this.transactions.withLockedPlayer(playerId, async (tx) => {
      const player = tx.player;
      if (!player) throw new DomainError('SESSION_REQUIRED');
      // Preserve the public error precedence: unknown checkpoint before stale version.
      const checkpoint = await tx.findCheckpoint(checkpointId);
      if (!checkpoint) throw new DomainError('CHECKPOINT_NOT_FOUND');
      if (request.progressVersion !== player.progressVersion)
        throw new DomainError('PROGRESS_VERSION_MISMATCH');
      const existing = await tx.findClaim(player.progressVersion, checkpointId);
      const status = checkpointStatus(player.totalScore, checkpoint.requiredScore, !!existing);
      if (status === 'LOCKED') throw new DomainError('CHECKPOINT_LOCKED');
      if (status === 'CLAIMED') throw new DomainError('REWARD_ALREADY_CLAIMED');
      const claim = await tx.createClaim(player.progressVersion, checkpointId);
      return {
        claimId: claim.id,
        checkpointId: checkpoint.id,
        rewardName: checkpoint.rewardName,
        claimedAt: claim.claimedAt.toISOString(),
        totalScore: player.totalScore,
        progressVersion: claim.progressVersion,
      };
    });
  }
}
