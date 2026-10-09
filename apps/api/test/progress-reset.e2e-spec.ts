import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';
import { startSession } from './support/session.js';

describe('POST /api/me/reset (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookie: string;
  let playerId: string;

  const server = () => request(app.getHttpServer());
  const reset = (body: object = { progressVersion: 1 }) =>
    server().post('/api/me/reset').set('Cookie', cookie).send(body);
  const play = (progressVersion: number) =>
    server()
      .post('/api/game-rounds')
      .set('Cookie', cookie)
      .send({ requestId: randomUUID(), progressVersion });
  const claim = (checkpointId: string, progressVersion: number) =>
    server()
      .post(`/api/checkpoints/${checkpointId}/claim`)
      .set('Cookie', cookie)
      .send({ progressVersion });

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
    const response = await server().post('/api/me/reset').send({ progressVersion: 1 }).expect(401);
    expect(response.body.code).toBe('SESSION_REQUIRED');
  });

  it.each([
    ['a missing body', {}],
    ['progressVersion 0', { progressVersion: 0 }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_, body) => {
    const response = await reset(body).expect(400);
    expect(response.body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'progressVersion ต้องเป็นจำนวนเต็มตั้งแต่ 1',
    });
  });

  it('returns 409 PROGRESS_VERSION_MISMATCH for a stale version without changing anything', async () => {
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 3000 } });

    const response = await reset({ progressVersion: 2 }).expect(409);

    expect(response.body.code).toBe('PROGRESS_VERSION_MISMATCH');
    const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
    expect(player).toMatchObject({ totalScore: 3000, progressVersion: 1 });
  });

  it('clears score and histories, increments the version and keeps the session', async () => {
    await play(1).expect(200);
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 5000 } });
    await claim('checkpoint-5000', 1).expect(200);

    const response = await reset().expect(200);

    expect(response.body).toEqual({
      totalScore: 0,
      progressVersion: 2,
      resetAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
    expect(await prisma.gameRound.count({ where: { playerId } })).toBe(0);
    expect(await prisma.rewardClaim.count({ where: { playerId } })).toBe(0);
    expect(await prisma.player.count()).toBe(1);

    const progress = await server().get('/api/me').set('Cookie', cookie).expect(200);
    expect(progress.body).toMatchObject({ totalScore: 0, progressVersion: 2 });
    for (const path of ['/api/game-rounds', '/api/reward-claims']) {
      const history = await server().get(path).set('Cookie', cookie).expect(200);
      expect(history.body.totalItems).toBe(0);
    }
  });

  it('makes rewards claimable again once the score reaches the threshold', async () => {
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 5000 } });
    await claim('checkpoint-5000', 1).expect(200);
    await reset().expect(200);

    await claim('checkpoint-5000', 2).expect(409, /CHECKPOINT_LOCKED/);
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 5000 } });
    await claim('checkpoint-5000', 2).expect(200);
  });

  it('rejects play and claim requests that still use the old version', async () => {
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 5000 } });
    await reset().expect(200);

    const staleRound = await play(1).expect(409);
    const staleClaim = await claim('checkpoint-5000', 1).expect(409);

    expect(staleRound.body.code).toBe('PROGRESS_VERSION_MISMATCH');
    expect(staleClaim.body.code).toBe('PROGRESS_VERSION_MISMATCH');
  });

  it('applies only one of two concurrent resets with the same version', async () => {
    const responses = await Promise.all([reset(), reset()]);

    expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([200, 409]);
    const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
    expect(player.progressVersion).toBe(2);
  });
});
