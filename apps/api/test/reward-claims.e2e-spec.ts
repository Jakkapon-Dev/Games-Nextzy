import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';
import { startSession } from './support/session.js';

describe('POST /api/checkpoints/:id/claim (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookie: string;
  let playerId: string;

  const claim = (checkpointId: string, body: object = { progressVersion: 1 }) =>
    request(app.getHttpServer())
      .post(`/api/checkpoints/${checkpointId}/claim`)
      .set('Cookie', cookie)
      .send(body);

  const setScore = (totalScore: number, progressVersion = 1) =>
    prisma.player.update({ where: { id: playerId }, data: { totalScore, progressVersion } });

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
    const response = await request(app.getHttpServer())
      .post('/api/checkpoints/checkpoint-5000/claim')
      .send({ progressVersion: 1 })
      .expect(401);
    expect(response.body.code).toBe('SESSION_REQUIRED');
  });

  it.each([
    ['a missing body', {}],
    ['progressVersion 0', { progressVersion: 0 }],
    ['a string progressVersion', { progressVersion: '1' }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_, body) => {
    const response = await claim('checkpoint-5000', body).expect(400);
    expect(response.body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'progressVersion ต้องเป็นจำนวนเต็มตั้งแต่ 1',
    });
  });

  it('returns 404 CHECKPOINT_NOT_FOUND for an unknown checkpoint, before other checks', async () => {
    const response = await claim('checkpoint-9999', { progressVersion: 99 }).expect(404);
    expect(response.body).toEqual({
      code: 'CHECKPOINT_NOT_FOUND',
      message: 'ไม่พบ checkpoint ที่ระบุ',
    });
  });

  it('returns 409 PROGRESS_VERSION_MISMATCH for a stale progress version', async () => {
    await setScore(8000, 2);
    const response = await claim('checkpoint-5000', { progressVersion: 1 }).expect(409);
    expect(response.body.code).toBe('PROGRESS_VERSION_MISMATCH');
  });

  it('returns 409 CHECKPOINT_LOCKED below the required score', async () => {
    await setScore(4999);
    const response = await claim('checkpoint-5000').expect(409);
    expect(response.body).toEqual({
      code: 'CHECKPOINT_LOCKED',
      message: 'คะแนนสะสมยังไม่ถึงเกณฑ์รับรางวัล',
    });
  });

  it('claims a reward without deducting points', async () => {
    await setScore(8500);

    const response = await claim('checkpoint-5000').expect(200);

    expect(response.body).toEqual({
      claimId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      checkpointId: 'checkpoint-5000',
      rewardName: 'รางวัล A',
      claimedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      totalScore: 8500,
      progressVersion: 1,
    });
    expect((await prisma.player.findUniqueOrThrow({ where: { id: playerId } })).totalScore).toBe(
      8500,
    );
  });

  it('returns 409 REWARD_ALREADY_CLAIMED when claiming twice', async () => {
    await setScore(5000);
    await claim('checkpoint-5000').expect(200);

    const response = await claim('checkpoint-5000').expect(409);

    expect(response.body).toEqual({
      code: 'REWARD_ALREADY_CLAIMED',
      message: 'รับรางวัลของ checkpoint นี้แล้ว',
    });
    expect(await prisma.rewardClaim.count({ where: { playerId } })).toBe(1);
  });

  it('allows claiming unlocked checkpoints in any order', async () => {
    await setScore(10000);
    await claim('checkpoint-10000').expect(200);
    await claim('checkpoint-5000').expect(200);
    await claim('checkpoint-7500').expect(200);
    expect(await prisma.rewardClaim.count({ where: { playerId } })).toBe(3);
  });

  it('shows claimed checkpoints as CLAIMED in the player progress', async () => {
    await setScore(8500);
    await claim('checkpoint-5000').expect(200);

    const response = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(
      response.body.checkpoints.map((c: { id: string; status: string }) => [c.id, c.status]),
    ).toEqual([
      ['checkpoint-5000', 'CLAIMED'],
      ['checkpoint-7500', 'CLAIMABLE'],
      ['checkpoint-10000', 'LOCKED'],
    ]);
  });

  it('accepts only one of several concurrent claims for the same checkpoint', async () => {
    await setScore(5000);

    const responses = await Promise.all(Array.from({ length: 5 }, () => claim('checkpoint-5000')));

    expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([200, 409, 409, 409, 409]);
    expect(
      responses
        .filter((r) => r.status === 409)
        .every((r) => r.body.code === 'REWARD_ALREADY_CLAIMED'),
    ).toBe(true);
    expect(await prisma.rewardClaim.count({ where: { playerId } })).toBe(1);
  });

  it('allows the same checkpoint to be claimed again in a new progress version', async () => {
    await setScore(5000);
    await claim('checkpoint-5000').expect(200);

    await setScore(5000, 2);
    await claim('checkpoint-5000', { progressVersion: 2 }).expect(200);

    expect(await prisma.rewardClaim.count({ where: { playerId } })).toBe(2);
  });
});
