import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { SCORE_OPTIONS, type RandomSource } from './../src/game/domain/game-rules.js';
import { RANDOM_SOURCE } from './../src/game/game.constants.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';
import { startSession } from './support/session.js';

const INVALID_REQUEST = 'requestId ต้องเป็น UUID และ progressVersion ต้องเป็นจำนวนเต็มตั้งแต่ 1';

/** Random source whose next result can be chosen by the test (defaults to 3000). */
class ControlledRandom implements RandomSource {
  nextScore: number = 3000;
  int(): number {
    return SCORE_OPTIONS.indexOf(this.nextScore as (typeof SCORE_OPTIONS)[number]);
  }
}

describe('POST /api/game-rounds (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let random: ControlledRandom;
  let cookie: string;
  let playerId: string;

  const play = (body: object) =>
    request(app.getHttpServer()).post('/api/game-rounds').set('Cookie', cookie).send(body);

  beforeEach(async () => {
    random = new ControlledRandom();
    app = await createTestApp((builder) =>
      builder.overrideProvider(RANDOM_SOURCE).useValue(random),
    );
    prisma = app.get(PrismaService);
    await resetDatabase(prisma);
    ({ cookie, playerId } = await startSession(app));
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 SESSION_REQUIRED without a session', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/game-rounds')
      .send({ requestId: randomUUID(), progressVersion: 1 })
      .expect(401);
    expect(response.body.code).toBe('SESSION_REQUIRED');
  });

  it.each([
    ['a missing body', {}],
    ['a non-UUID requestId', { requestId: 'abc', progressVersion: 1 }],
    ['progressVersion 0', { requestId: randomUUID(), progressVersion: 0 }],
    ['a string progressVersion', { requestId: randomUUID(), progressVersion: '1' }],
    ['a decimal progressVersion', { requestId: randomUUID(), progressVersion: 1.5 }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_, body) => {
    const response = await play(body).expect(400);
    expect(response.body).toEqual({ code: 'VALIDATION_ERROR', message: INVALID_REQUEST });
  });

  it('rejects unknown fields', async () => {
    const response = await play({
      requestId: randomUUID(),
      progressVersion: 1,
      pickedScore: 3000,
    }).expect(400);
    expect(response.body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'ไม่รองรับฟิลด์ pickedScore',
    });
  });

  it('plays a round, records it and adds the score', async () => {
    random.nextScore = 1000;
    const requestId = randomUUID();

    const response = await play({ requestId, progressVersion: 1 }).expect(200);

    expect(response.body).toEqual({
      roundId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      pickedScore: 1000,
      creditedScore: 1000,
      totalScore: 1000,
      progressVersion: 1,
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
    expect((await prisma.player.findUniqueOrThrow({ where: { id: playerId } })).totalScore).toBe(
      1000,
    );
    expect(await prisma.gameRound.count({ where: { playerId, requestId } })).toBe(1);
  });

  it('caps the total at 10,000 and records both picked and credited scores', async () => {
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 9500 } });
    random.nextScore = 3000;

    const response = await play({ requestId: randomUUID(), progressVersion: 1 }).expect(200);

    expect(response.body).toMatchObject({
      pickedScore: 3000,
      creditedScore: 500,
      totalScore: 10000,
    });
  });

  it('keeps recording rounds with 0 credited points once the total is 10,000', async () => {
    await prisma.player.update({ where: { id: playerId }, data: { totalScore: 10000 } });

    const response = await play({ requestId: randomUUID(), progressVersion: 1 }).expect(200);

    expect(response.body).toMatchObject({ creditedScore: 0, totalScore: 10000 });
    expect(await prisma.gameRound.count({ where: { playerId } })).toBe(1);
  });

  it('returns the original round for a repeated requestId without adding points again', async () => {
    const requestId = randomUUID();
    random.nextScore = 500;
    const first = await play({ requestId, progressVersion: 1 }).expect(200);

    random.nextScore = 3000;
    const second = await play({ requestId, progressVersion: 1 }).expect(200);

    expect(second.body).toEqual(first.body);
    expect((await prisma.player.findUniqueOrThrow({ where: { id: playerId } })).totalScore).toBe(
      500,
    );
    expect(await prisma.gameRound.count({ where: { playerId } })).toBe(1);
  });

  it('returns 409 PROGRESS_VERSION_MISMATCH for a stale progress version', async () => {
    await prisma.player.update({ where: { id: playerId }, data: { progressVersion: 2 } });

    const response = await play({ requestId: randomUUID(), progressVersion: 1 }).expect(409);

    expect(response.body).toEqual({
      code: 'PROGRESS_VERSION_MISMATCH',
      message: 'ข้อมูลการสะสมเปลี่ยนแล้ว กรุณาโหลดข้อมูลล่าสุด',
    });
    expect(await prisma.gameRound.count({ where: { playerId } })).toBe(0);
  });

  it('keeps the total consistent under concurrent plays', async () => {
    random.nextScore = 3000;

    const responses = await Promise.all(
      Array.from({ length: 10 }, () => play({ requestId: randomUUID(), progressVersion: 1 })),
    );

    expect(responses.map((r) => r.status)).toEqual(Array(10).fill(200));
    const rounds = await prisma.gameRound.findMany({ where: { playerId } });
    const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
    expect(rounds).toHaveLength(10);
    expect(player.totalScore).toBe(10000);
    expect(rounds.reduce((sum, round) => sum + round.creditedScore, 0)).toBe(10000);
    expect(rounds.map((round) => round.totalScoreAfter).sort((a, b) => a - b)).toEqual([
      3000, 6000, 9000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
    ]);
  });

  it('records a single round when the same requestId is sent concurrently', async () => {
    const requestId = randomUUID();

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => play({ requestId, progressVersion: 1 })),
    );

    expect(responses.map((r) => r.status)).toEqual(Array(5).fill(200));
    expect(new Set(responses.map((r) => r.body.roundId as string)).size).toBe(1);
    expect(await prisma.gameRound.count({ where: { playerId } })).toBe(1);
    expect((await prisma.player.findUniqueOrThrow({ where: { id: playerId } })).totalScore).toBe(
      3000,
    );
  });
});
