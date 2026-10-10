import type { Player } from '../../player/domain/player.js';
import type { Pagination } from '../../shared/application/pagination.js';
import type { GameHistoryRepository } from './game-history-repository.js';

export class GetGameHistory {
  constructor(private readonly repository: GameHistoryRepository) {}

  async execute(player: Player, query: Pagination) {
    const page = await this.repository.findHistory(player, query);
    return {
      ...page,
      items: page.items.map((round) => ({
        roundId: round.id,
        pickedScore: round.pickedScore,
        creditedScore: round.creditedScore,
        totalScoreAfter: round.totalScoreAfter,
        createdAt: round.createdAt.toISOString(),
      })),
    };
  }
}
