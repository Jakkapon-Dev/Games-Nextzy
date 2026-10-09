import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../common/errors/domain-error.js';
import type { GameRound } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { creditedScore, pickScore, type RandomSource } from './domain/game-rules.js';
import type { PlayedRoundDto } from './dto/game-round.dto.js';
import type { PlayGameRoundDto } from './dto/play-game-round.dto.js';
import { RANDOM_SOURCE } from './game.constants.js';

interface LockedPlayer {
  total_score: number;
  progress_version: number;
}

function toPlayedRound(round: GameRound): PlayedRoundDto {
  return {
    roundId: round.id,
    pickedScore: round.pickedScore,
    creditedScore: round.creditedScore,
    totalScore: round.totalScoreAfter,
    progressVersion: round.progressVersion,
    createdAt: round.createdAt.toISOString(),
  };
}

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(RANDOM_SOURCE) private readonly random: RandomSource,
  ) {}

  /**
   * Plays one round inside a transaction that locks the player row, in this order:
   * 1. a round with the same request id in the requested version is returned unchanged;
   * 2. a stale progress version is rejected;
   * 3. otherwise a score is picked, capped, recorded and added to the total.
   */
  async play(playerId: string, request: PlayGameRoundDto): Promise<PlayedRoundDto> {
    return this.prisma.$transaction(async (tx) => {
      const [player] = await tx.$queryRaw<LockedPlayer[]>`
        SELECT total_score, progress_version FROM players WHERE id = ${playerId}::uuid FOR UPDATE`;
      if (!player) {
        throw new DomainError('SESSION_REQUIRED');
      }

      const existing = await tx.gameRound.findUnique({
        where: {
          playerId_progressVersion_requestId: {
            playerId,
            progressVersion: request.progressVersion,
            requestId: request.requestId,
          },
        },
      });
      if (existing) {
        return toPlayedRound(existing);
      }

      if (request.progressVersion !== player.progress_version) {
        throw new DomainError('PROGRESS_VERSION_MISMATCH');
      }

      const picked = pickScore(this.random);
      const credited = creditedScore(player.total_score, picked);
      const totalScoreAfter = player.total_score + credited;

      const round = await tx.gameRound.create({
        data: {
          playerId,
          requestId: request.requestId,
          progressVersion: player.progress_version,
          pickedScore: picked,
          creditedScore: credited,
          totalScoreAfter,
        },
      });
      await tx.player.update({ where: { id: playerId }, data: { totalScore: totalScoreAfter } });

      return toPlayedRound(round);
    });
  }
}
