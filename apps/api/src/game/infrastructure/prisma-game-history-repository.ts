import { Injectable } from '@nestjs/common';
import type { Player } from '../../player/domain/player.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Pagination } from '../../shared/application/pagination.js';
import type { GameHistoryRepository } from '../application/game-history-repository.js';

@Injectable()
export class PrismaGameHistoryRepository implements GameHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findHistory(player: Player, query: Pagination) {
    const where = { playerId: player.id, progressVersion: player.progressVersion };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.gameRound.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.gameRound.count({ where }),
    ]);
    return { items, totalItems, ...query };
  }
}
