import { Injectable } from '@nestjs/common';
import { DomainError } from '../common/errors/domain-error.js';
import { checkpointStatus, MAX_SCORE, SCORE_OPTIONS } from '../game/domain/game-rules.js';
import type { Player } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PlayerProgressDto } from './dto/player-progress.dto.js';
import type { ProgressResetDto, ResetProgressDto } from './dto/reset-progress.dto.js';

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(player: Player): Promise<PlayerProgressDto> {
    const [checkpoints, claims] = await Promise.all([
      this.prisma.checkpoint.findMany({ orderBy: { requiredScore: 'asc' } }),
      this.prisma.rewardClaim.findMany({
        where: { playerId: player.id, progressVersion: player.progressVersion },
        select: { checkpointId: true },
      }),
    ]);
    const claimedIds = new Set(claims.map((claim) => claim.checkpointId));

    return {
      totalScore: player.totalScore,
      maxScore: MAX_SCORE,
      progressVersion: player.progressVersion,
      scoreOptions: [...SCORE_OPTIONS],
      checkpoints: checkpoints.map((checkpoint) => ({
        id: checkpoint.id,
        requiredScore: checkpoint.requiredScore,
        rewardName: checkpoint.rewardName,
        status: checkpointStatus(
          player.totalScore,
          checkpoint.requiredScore,
          claimedIds.has(checkpoint.id),
        ),
      })),
    };
  }

  /**
   * Starts a new progress cycle for the same player and session: clears both histories,
   * sets the score to 0 and increments the progress version. A stale version is rejected.
   */
  async reset(playerId: string, request: ResetProgressDto): Promise<ProgressResetDto> {
    return this.prisma.$transaction(async (tx) => {
      const [player] = await tx.$queryRaw<{ progress_version: number }[]>`
        SELECT progress_version FROM players WHERE id = ${playerId}::uuid FOR UPDATE`;
      if (!player) {
        throw new DomainError('SESSION_REQUIRED');
      }
      if (request.progressVersion !== player.progress_version) {
        throw new DomainError('PROGRESS_VERSION_MISMATCH');
      }

      await tx.gameRound.deleteMany({ where: { playerId } });
      await tx.rewardClaim.deleteMany({ where: { playerId } });
      const updated = await tx.player.update({
        where: { id: playerId },
        data: { totalScore: 0, progressVersion: { increment: 1 } },
      });

      return {
        totalScore: updated.totalScore,
        progressVersion: updated.progressVersion,
        resetAt: updated.updatedAt.toISOString(),
      };
    });
  }
}
