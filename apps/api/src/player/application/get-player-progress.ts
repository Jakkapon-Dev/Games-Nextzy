import { checkpointStatus, MAX_SCORE, SCORE_OPTIONS } from '../../game/domain/game-rules.js';
import type { Player } from '../domain/player.js';
import type { PlayerProgressRepository } from './player-progress-repository.js';

export class GetPlayerProgress {
  constructor(private readonly repository: PlayerProgressRepository) {}

  async execute(player: Player) {
    const [checkpoints, claimed] = await Promise.all([
      this.repository.findCheckpoints(),
      this.repository.findClaimedCheckpointIds(player),
    ]);
    const claimedIds = new Set(claimed);
    return {
      totalScore: player.totalScore,
      maxScore: MAX_SCORE,
      progressVersion: player.progressVersion,
      scoreOptions: [...SCORE_OPTIONS],
      checkpoints: checkpoints.map((checkpoint) => ({
        ...checkpoint,
        status: checkpointStatus(
          player.totalScore,
          checkpoint.requiredScore,
          claimedIds.has(checkpoint.id),
        ),
      })),
    };
  }
}
