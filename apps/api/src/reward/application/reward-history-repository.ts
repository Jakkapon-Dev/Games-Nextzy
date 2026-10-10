import type { Player } from '../../player/domain/player.js';
import type { Page, Pagination } from '../../shared/application/pagination.js';
import type { Claim } from '../../shared/domain/progress.js';

export interface RewardHistoryRepository {
  findHistory(player: Player, query: Pagination): Promise<Page<Claim & { rewardName: string }>>;
}
