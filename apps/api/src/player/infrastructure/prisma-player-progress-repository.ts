import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PlayerProgressRepository } from '../application/player-progress-repository.js';
import type { Player } from '../domain/player.js';

@Injectable()
export class PrismaPlayerProgressRepository implements PlayerProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCheckpoints() {
    return this.prisma.checkpoint.findMany({ orderBy: { requiredScore: 'asc' } });
  }

  async findClaimedCheckpointIds(player: Player) {
    const claims = await this.prisma.rewardClaim.findMany({
      where: { playerId: player.id, progressVersion: player.progressVersion },
      select: { checkpointId: true },
    });
    return claims.map((claim) => claim.checkpointId);
  }
}
