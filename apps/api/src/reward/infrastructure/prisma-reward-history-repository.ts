import { Injectable } from '@nestjs/common';
import type { Player } from '../../player/domain/player.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Pagination } from '../../shared/application/pagination.js';
import type { RewardHistoryRepository } from '../application/reward-history-repository.js';

@Injectable()
export class PrismaRewardHistoryRepository implements RewardHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findHistory(player: Player, query: Pagination) {
    const where = { playerId: player.id, progressVersion: player.progressVersion };
    const [claims, totalItems] = await this.prisma.$transaction([
      this.prisma.rewardClaim.findMany({
        where,
        include: { checkpoint: true },
        orderBy: [{ claimedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.rewardClaim.count({ where }),
    ]);
    return {
      items: claims.map((claim) => ({
        id: claim.id,
        playerId: claim.playerId,
        checkpointId: claim.checkpointId,
        progressVersion: claim.progressVersion,
        claimedAt: claim.claimedAt,
        rewardName: claim.checkpoint.rewardName,
      })),
      totalItems,
      ...query,
    };
  }
}
