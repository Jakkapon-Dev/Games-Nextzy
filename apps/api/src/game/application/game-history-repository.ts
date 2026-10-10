import type { Player } from '../../player/domain/player.js';
import type { Page, Pagination } from '../../shared/application/pagination.js';
import type { Round } from '../../shared/domain/progress.js';

export interface GameHistoryRepository {
  findHistory(player: Player, query: Pagination): Promise<Page<Round>>;
}
