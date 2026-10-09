import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { generateSessionToken, hashSessionToken } from './../src/session/session-token.js';
import { createTestApp } from './support/create-test-app.js';
import { resetDatabase } from './support/reset-database.js';

const COOKIE = 'nextzy_session';

function sessionCookieFrom(response: request.Response): string | undefined {
  const header = response.headers['set-cookie'] as unknown as string[] | undefined;
  return header?.find((cookie) => cookie.startsWith(`${COOKIE}=`));
}

function tokenFrom(setCookie: string): string {
  return setCookie.split(';')[0].slice(COOKIE.length + 1);
}

describe('POST /api/session (e2e)', () => {
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

  it('creates a new player and sets an HttpOnly session cookie', async () => {
    const response = await request(app.getHttpServer()).post('/api/session').expect(200);

    expect(response.body).toEqual({
      playerId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      totalScore: 0,
      progressVersion: 1,
    });

    const setCookie = sessionCookieFrom(response);
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain(`Max-Age=${180 * 24 * 60 * 60}`);
    expect(setCookie).not.toContain('Secure');
  });

  it('stores only a hash of the token', async () => {
    const response = await request(app.getHttpServer()).post('/api/session').expect(200);
    const token = tokenFrom(sessionCookieFrom(response)!);

    const sessions = await prisma.playerSession.findMany();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).toBe(hashSessionToken(token));
    expect(sessions[0].tokenHash).not.toBe(token);
  });

  it('returns the same player for an existing session without setting a new cookie', async () => {
    const first = await request(app.getHttpServer()).post('/api/session').expect(200);
    const cookie = sessionCookieFrom(first)!.split(';')[0];
    await prisma.player.update({
      where: { id: first.body.playerId },
      data: { totalScore: 4000, progressVersion: 2 },
    });

    const second = await request(app.getHttpServer())
      .post('/api/session')
      .set('Cookie', cookie)
      .expect(200);

    expect(second.body).toEqual({
      playerId: first.body.playerId,
      totalScore: 4000,
      progressVersion: 2,
    });
    expect(sessionCookieFrom(second)).toBeUndefined();
    expect(await prisma.player.count()).toBe(1);
  });

  it('creates a new player when the cookie is unknown', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/session')
      .set('Cookie', `${COOKIE}=not-a-real-token`)
      .expect(200);

    expect(response.body.totalScore).toBe(0);
    expect(sessionCookieFrom(response)).toBeDefined();
  });

  it('creates a new player when the session has expired, keeping the old player data', async () => {
    const token = generateSessionToken();
    const oldPlayer = await prisma.player.create({
      data: {
        totalScore: 5000,
        sessions: {
          create: { tokenHash: hashSessionToken(token), expiresAt: new Date(Date.now() - 1000) },
        },
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/session')
      .set('Cookie', `${COOKIE}=${token}`)
      .expect(200);

    expect(response.body.playerId).not.toBe(oldPlayer.id);
    expect(response.body.totalScore).toBe(0);
    expect(sessionCookieFrom(response)).toBeDefined();
    expect((await prisma.player.findUnique({ where: { id: oldPlayer.id } }))?.totalScore).toBe(
      5000,
    );
  });
});
