import type { Checkpoint } from '../../shared/domain/progress.js';
import type { Player } from '../domain/player.js';

export interface PlayerProgressRepository {
  findCheckpoints(): Promise<Checkpoint[]>;
  findClaimedCheckpointIds(player: Player): Promise<string[]>;
}
