import { Injectable } from '@nestjs/common';
import { DomainError } from '../common/errors/domain-error.js';
import { checkpointStatus } from '../game/domain/game-rules.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ClaimRewardDto } from './dto/claim-reward.dto.js';
import type { ClaimedRewardDto } from './dto/reward-claim.dto.js';

interface LockedPlayer {
  total_score: number;
  progress_version: number;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class RewardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Claims a checkpoint reward without deducting points, inside a transaction that locks the
   * player row. Checks run in this order: unknown checkpoint (404), stale progress version,
   * score below the requirement, reward already claimed (all 409).
   */
  async claim(
    playerId: string,
    checkpointId: string,
    request: ClaimRewardDto,
  ): Promise<ClaimedRewardDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const [player] = await tx.$queryRaw<LockedPlayer[]>`
          SELECT total_score, progress_version FROM players WHERE id = ${playerId}::uuid FOR UPDATE`;
        if (!player) {
          throw new DomainError('SESSION_REQUIRED');
        }

        const checkpoint = await tx.checkpoint.findUnique({ where: { id: checkpointId } });
        if (!checkpoint) {
          throw new DomainError('CHECKPOINT_NOT_FOUND');
        }

        if (request.progressVersion !== player.progress_version) {
          throw new DomainError('PROGRESS_VERSION_MISMATCH');
        }

        const existing = await tx.rewardClaim.findUnique({
          where: {
            playerId_progressVersion_checkpointId: {
              playerId,
              progressVersion: player.progress_version,
              checkpointId,
            },
          },
        });
        const status = checkpointStatus(player.total_score, checkpoint.requiredScore, !!existing);
        if (status === 'LOCKED') {
          throw new DomainError('CHECKPOINT_LOCKED');
        }
        if (status === 'CLAIMED') {
          throw new DomainError('REWARD_ALREADY_CLAIMED');
        }

        const claim = await tx.rewardClaim.create({
          data: { playerId, checkpointId, progressVersion: player.progress_version },
        });

        return {
          claimId: claim.id,
          checkpointId: checkpoint.id,
          rewardName: checkpoint.rewardName,
          claimedAt: claim.claimedAt.toISOString(),
          totalScore: player.total_score,
          progressVersion: claim.progressVersion,
        };
      });
    } catch (error) {
      // The row lock prevents this, but the unique key is the final safeguard.
      if (isUniqueViolation(error)) {
        throw new DomainError('REWARD_ALREADY_CLAIMED');
      }
      throw error;
    }
  }
}
