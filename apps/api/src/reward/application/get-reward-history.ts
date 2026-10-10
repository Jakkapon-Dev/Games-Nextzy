import type { Player } from '../../player/domain/player.js';
import type { Pagination } from '../../shared/application/pagination.js';
import type { RewardHistoryRepository } from './reward-history-repository.js';

export class GetRewardHistory {
  constructor(private readonly repository: RewardHistoryRepository) {}

  async execute(player: Player, query: Pagination) {
    const page = await this.repository.findHistory(player, query);
    return {
      ...page,
      items: page.items.map((claim) => ({
        claimId: claim.id,
        checkpointId: claim.checkpointId,
        rewardName: claim.rewardName,
        claimedAt: claim.claimedAt.toISOString(),
      })),
    };
  }
}
