import { Injectable } from '@nestjs/common';
import { checkpointStatus, MAX_SCORE, SCORE_OPTIONS } from '../game/domain/game-rules.js';
import type { Player } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PlayerProgressDto } from './dto/player-progress.dto.js';

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
}
