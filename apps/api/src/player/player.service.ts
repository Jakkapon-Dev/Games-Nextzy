import { Injectable } from '@nestjs/common';
import { checkpointStatus, MAX_SCORE, SCORE_OPTIONS } from '../game/domain/game-rules.js';
import type { Player } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PlayerProgressDto } from './dto/player-progress.dto.js';

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(player: Player): Promise<PlayerProgressDto> {
    const checkpoints = await this.prisma.checkpoint.findMany({
      orderBy: { requiredScore: 'asc' },
    });
    // Reward claims are introduced with the claim endpoint; until then nothing is claimed.
    const claimedIds = new Set<string>();

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
