import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';
import { SESSION_COOKIE, startSession } from './support/session.js';

describe('GET /api/me (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDatabase(prisma);
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 SESSION_REQUIRED without a session cookie', async () => {
    const response = await request(app.getHttpServer()).get('/api/me').expect(401);
    expect(response.body).toEqual({
      code: 'SESSION_REQUIRED',
      message: 'ไม่พบ session ผู้เล่น กรุณาเริ่ม session ก่อน',
    });
  });

  it('returns 401 SESSION_REQUIRED for an unknown session cookie', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', `${SESSION_COOKIE}=unknown`)
      .expect(401);
    expect(response.body.code).toBe('SESSION_REQUIRED');
  });

  it('returns the progress of a new player with every checkpoint locked', async () => {
    const { cookie } = await startSession(app);

    const response = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toEqual({
      totalScore: 0,
      maxScore: 10000,
      progressVersion: 1,
      scoreOptions: [300, 500, 1000, 3000],
      checkpoints: [
        { id: 'checkpoint-5000', requiredScore: 5000, rewardName: 'รางวัล A', status: 'LOCKED' },
        { id: 'checkpoint-7500', requiredScore: 7500, rewardName: 'รางวัล B', status: 'LOCKED' },
        { id: 'checkpoint-10000', requiredScore: 10000, rewardName: 'รางวัล C', status: 'LOCKED' },
      ],
    });
  });

  it('marks checkpoints within the total score as claimable', async () => {
    const { cookie, playerId } = await startSession(app);
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 8500 } });

    const response = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body.totalScore).toBe(8500);
    expect(
      response.body.checkpoints.map((c: { id: string; status: string }) => [c.id, c.status]),
    ).toEqual([
      ['checkpoint-5000', 'CLAIMABLE'],
      ['checkpoint-7500', 'CLAIMABLE'],
      ['checkpoint-10000', 'LOCKED'],
    ]);
  });
});
