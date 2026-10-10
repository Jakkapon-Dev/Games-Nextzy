import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PrismaProgressUnitOfWork } from '../src/shared/infrastructure/prisma-progress-unit-of-work.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';
import { startSession } from './support/session.js';

describe('Prisma progress transaction adapter (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let transactions: PrismaProgressUnitOfWork;
  let playerId: string;

  beforeEach(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    transactions = app.get(PrismaProgressUnitOfWork);
    await resetDatabase(prisma);
    ({ playerId } = await startSession(app));
  });

  afterEach(async () => {
    await app.close();
  });

  it('rolls back the new round when updating the score violates the database constraint', async () => {
    await expect(
      transactions.withLockedPlayer(playerId, async (tx) => {
        await tx.createRound({
          requestId: randomUUID(),
          progressVersion: 1,
          pickedScore: 3000,
          creditedScore: 3000,
          totalScoreAfter: 3000,
        });
        await tx.setTotalScore(10001);
      }),
    ).rejects.toThrow();
    expect(await prisma.gameRound.count({ where: { playerId } })).toBe(0);
    expect(await prisma.player.findUniqueOrThrow({ where: { id: playerId } })).toMatchObject({
      totalScore: 0,
      progressVersion: 1,
    });
  });

  it('rolls back cleared histories when resetting the player fails', async () => {
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 5000 } });
    await prisma.gameRound.create({
      data: {
        playerId,
        requestId: randomUUID(),
        progressVersion: 1,
        pickedScore: 3000,
        creditedScore: 3000,
        totalScoreAfter: 3000,
      },
    });
    await prisma.rewardClaim.create({
      data: { playerId, checkpointId: 'checkpoint-5000', progressVersion: 1 },
    });
    await expect(
      transactions.withLockedPlayer(playerId, async (tx) => {
        await tx.clearHistory();
        await tx.resetPlayer(-1, 2);
      }),
    ).rejects.toThrow();
    expect(await prisma.gameRound.count({ where: { playerId } })).toBe(1);
    expect(await prisma.rewardClaim.count({ where: { playerId } })).toBe(1);
    expect(await prisma.player.findUniqueOrThrow({ where: { id: playerId } })).toMatchObject({
      totalScore: 5000,
      progressVersion: 1,
    });
  });

  it('translates a database duplicate claim into the domain error and rolls back', async () => {
    await expect(
      transactions.withLockedPlayer(playerId, async (tx) => {
        await tx.createClaim(1, 'checkpoint-5000');
        await tx.createClaim(1, 'checkpoint-5000');
      }),
    ).rejects.toMatchObject({ code: 'REWARD_ALREADY_CLAIMED' });
    expect(await prisma.rewardClaim.count({ where: { playerId } })).toBe(0);
  });

  it('provides a null snapshot for a player that no longer exists', async () => {
    expect(await transactions.withLockedPlayer(randomUUID(), async (tx) => tx.player)).toBeNull();
  });
});
