import { Injectable } from '@nestjs/common';
import { DomainError } from '../domain/domain-error.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ProgressTransaction,
  ProgressUnitOfWork,
} from '../application/progress-unit-of-work.js';

@Injectable()
export class PrismaProgressUnitOfWork implements ProgressUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  withLockedPlayer<T>(playerId: string, work: (tx: ProgressTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (db) => {
      const [row] = await db.$queryRaw<{ total_score: number; progress_version: number }[]>`
        SELECT total_score, progress_version FROM players WHERE id = ${playerId}::uuid FOR UPDATE`;
      const tx: ProgressTransaction = {
        player: row
          ? { id: playerId, totalScore: row.total_score, progressVersion: row.progress_version }
          : null,
        findRound: (progressVersion, requestId) =>
          db.gameRound.findUnique({
            where: { playerId_progressVersion_requestId: { playerId, progressVersion, requestId } },
          }),
        createRound: (round) => db.gameRound.create({ data: { ...round, playerId } }),
        setTotalScore: async (totalScore) => {
          await db.player.update({ where: { id: playerId }, data: { totalScore } });
        },
        findCheckpoint: (id) => db.checkpoint.findUnique({ where: { id } }),
        findClaim: (progressVersion, checkpointId) =>
          db.rewardClaim.findUnique({
            where: {
              playerId_progressVersion_checkpointId: { playerId, progressVersion, checkpointId },
            },
          }),
        createClaim: async (progressVersion, checkpointId) => {
          try {
            return await db.rewardClaim.create({
              data: { playerId, progressVersion, checkpointId },
            });
          } catch (error) {
            // Translate the persistence-specific final duplicate safeguard at the boundary.
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              throw new DomainError('REWARD_ALREADY_CLAIMED');
            }
            throw error;
          }
        },
        clearHistory: async () => {
          await db.gameRound.deleteMany({ where: { playerId } });
          await db.rewardClaim.deleteMany({ where: { playerId } });
        },
        resetPlayer: (totalScore, progressVersion) =>
          db.player.update({
            where: { id: playerId },
            data: { totalScore, progressVersion },
          }),
      };
      return work(tx);
    });
  }
}
