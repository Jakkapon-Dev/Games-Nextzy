import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';
import { startSession } from './support/session.js';

const INVALID_PAGINATION =
  'page ต้องเป็นจำนวนเต็มตั้งแต่ 1 และ limit ต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 100';

describe('GET /api/game-rounds (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookie: string;
  let playerId: string;

  const history = (query = '') =>
    request(app.getHttpServer()).get(`/api/game-rounds${query}`).set('Cookie', cookie);

  /** Inserts rounds with explicit, increasing timestamps (minute i for the i-th round). */
  async function seedRounds(count: number, progressVersion = 1): Promise<void> {
    for (let i = 1; i <= count; i++) {
      await prisma.gameRound.create({
        data: {
          playerId,
          requestId: randomUUID(),
          progressVersion,
          pickedScore: 300,
          creditedScore: 300,
          totalScoreAfter: 300 * i,
          createdAt: new Date(Date.UTC(2026, 9, 9, 10, i)),
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
    const response = await request(app.getHttpServer()).get('/api/game-rounds').expect(401);
    expect(response.body.code).toBe('SESSION_REQUIRED');
  });

  it('returns an empty first page by default', async () => {
    const response = await history().expect(200);
    expect(response.body).toEqual({ items: [], page: 1, limit: 20, totalItems: 0 });
  });

  it('lists played rounds with the documented fields', async () => {
    await request(app.getHttpServer())
      .post('/api/game-rounds')
      .set('Cookie', cookie)
      .send({ requestId: randomUUID(), progressVersion: 1 })
      .expect(200);

    const response = await history().expect(200);

    expect(response.body.totalItems).toBe(1);
    expect(response.body.items[0]).toEqual({
      roundId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      pickedScore: expect.any(Number),
      creditedScore: expect.any(Number),
      totalScoreAfter: expect.any(Number),
      createdAt: expect.stringMatching(/Z$/),
    });
  });

  it('returns rounds newest first and paginates', async () => {
    await seedRounds(5);

    const response = await history('?page=2&limit=2').expect(200);

    expect(response.body.page).toBe(2);
    expect(response.body.limit).toBe(2);
    expect(response.body.totalItems).toBe(5);
    expect(
      response.body.items.map((item: { totalScoreAfter: number }) => item.totalScoreAfter),
    ).toEqual([900, 600]);
    expect(response.body.items[0].createdAt).toBe('2026-10-09T10:03:00.000Z');
  });

  it('returns an empty page beyond the last one', async () => {
    await seedRounds(2);
    const response = await history('?page=3&limit=2').expect(200);
    expect(response.body).toEqual({ items: [], page: 3, limit: 2, totalItems: 2 });
  });

  it('only includes rounds from the current progress version', async () => {
    await seedRounds(2, 1);
    await prisma.player.update({ where: { id: playerId }, data: { progressVersion: 2 } });
    await seedRounds(1, 2);

    const response = await history().expect(200);

    expect(response.body.totalItems).toBe(1);
  });

  it.each(['?page=0', '?page=abc', '?page=1.5', '?limit=0', '?limit=101', '?limit=x'])(
    'returns 400 VALIDATION_ERROR for %s',
    async (query) => {
      const response = await history(query).expect(400);
      expect(response.body).toEqual({ code: 'VALIDATION_ERROR', message: INVALID_PAGINATION });
    },
  );

  it('accepts the maximum page size of 100', async () => {
    await history('?limit=100').expect(200);
  });
});
