import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';
import { startSession } from './support/session.js';

/**
 * Timestamps must be correct regardless of the database server's TimeZone setting
 * (e.g. a local PostgreSQL configured as Asia/Bangkok).
 */
describe('Timestamps (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookie: string;
  let playerId: string;

  beforeEach(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDatabase(prisma);
    ({ cookie, playerId } = await startSession(app));
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns a stored instant unchanged as ISO 8601 UTC', async () => {
    await prisma.$executeRaw`
      INSERT INTO game_rounds (id, player_id, request_id, progress_version, picked_score,
        credited_score, total_score_after, created_at)
      VALUES (${randomUUID()}::uuid, ${playerId}::uuid, ${randomUUID()}::uuid, 1, 300, 300, 300,
        '2025-02-15T13:00:00Z'::timestamptz)`;

    const response = await request(app.getHttpServer())
      .get('/api/game-rounds')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body.items[0].createdAt).toBe('2025-02-15T13:00:00.000Z');
  });

  it('stores the actual time when a round is played', async () => {
    const before = Date.now();
    await request(app.getHttpServer())
      .post('/api/game-rounds')
      .set('Cookie', cookie)
      .send({ requestId: randomUUID(), progressVersion: 1 })
      .expect(200);

    const [{ epoch }] = await prisma.$queryRaw<{ epoch: number }[]>`
      SELECT extract(epoch FROM created_at)::float8 AS epoch FROM game_rounds
      WHERE player_id = ${playerId}::uuid`;

    expect(Math.abs(epoch * 1000 - before)).toBeLessThan(60_000);
  });
});
