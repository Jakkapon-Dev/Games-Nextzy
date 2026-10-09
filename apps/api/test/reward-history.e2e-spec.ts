import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';
import { startSession } from './support/session.js';

const INVALID_PAGINATION =
  'page ต้องเป็นจำนวนเต็มตั้งแต่ 1 และ limit ต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 100';

describe('GET /api/reward-claims (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookie: string;
  let playerId: string;

  const history = (query = '') =>
    request(app.getHttpServer()).get(`/api/reward-claims${query}`).set('Cookie', cookie);

  /** Inserts claims with explicit timestamps; checkpoints are claimed in the given order. */
  async function seedClaims(checkpointIds: string[], progressVersion = 1): Promise<void> {
    for (const [index, checkpointId] of checkpointIds.entries()) {
      await prisma.rewardClaim.create({
        data: {
          playerId,
          checkpointId,
          progressVersion,
          claimedAt: new Date(Date.UTC(2026, 9, 9, 10, index + 1)),
        },
      });
    }
  }

  beforeEach(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDatabase(prisma);
    ({ cookie, playerId } = await startSession(app));
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 SESSION_REQUIRED without a session', async () => {
    const response = await request(app.getHttpServer()).get('/api/reward-claims').expect(401);
    expect(response.body.code).toBe('SESSION_REQUIRED');
  });

  it('returns an empty first page by default', async () => {
    const response = await history().expect(200);
    expect(response.body).toEqual({ items: [], page: 1, limit: 20, totalItems: 0 });
  });

  it('lists a claimed reward with the documented fields', async () => {
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 5000 } });
    const claim = await request(app.getHttpServer())
      .post('/api/checkpoints/checkpoint-5000/claim')
      .set('Cookie', cookie)
      .send({ progressVersion: 1 })
      .expect(200);

    const response = await history().expect(200);

    expect(response.body).toEqual({
      items: [
        {
          claimId: claim.body.claimId,
          checkpointId: 'checkpoint-5000',
          rewardName: 'รางวัล A',
          claimedAt: claim.body.claimedAt,
        },
      ],
      page: 1,
      limit: 20,
      totalItems: 1,
    });
  });

  it('returns claims newest first and paginates', async () => {
    await seedClaims(['checkpoint-10000', 'checkpoint-5000', 'checkpoint-7500']);

    const firstPage = await history('?limit=2').expect(200);
    const secondPage = await history('?page=2&limit=2').expect(200);

    const ids = (body: { items: { checkpointId: string }[] }) =>
      body.items.map((item) => item.checkpointId);
    expect(ids(firstPage.body)).toEqual(['checkpoint-7500', 'checkpoint-5000']);
    expect(ids(secondPage.body)).toEqual(['checkpoint-10000']);
    expect(firstPage.body.totalItems).toBe(3);
    expect(secondPage.body.totalItems).toBe(3);
  });

  it('only includes claims from the current progress version', async () => {
    await seedClaims(['checkpoint-5000', 'checkpoint-7500'], 1);
    await prisma.player.update({ where: { id: playerId }, data: { progressVersion: 2 } });
    await seedClaims(['checkpoint-5000'], 2);

    const response = await history().expect(200);

    expect(response.body.totalItems).toBe(1);
  });

  it.each(['?page=0', '?page=abc', '?limit=0', '?limit=101'])(
    'returns 400 VALIDATION_ERROR for %s',
    async (query) => {
      const response = await history(query).expect(400);
      expect(response.body).toEqual({ code: 'VALIDATION_ERROR', message: INVALID_PAGINATION });
    },
  );
});
