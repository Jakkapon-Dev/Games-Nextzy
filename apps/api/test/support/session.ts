import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';

export const SESSION_COOKIE = 'nextzy_session';

/** Starts a new session and returns the `Cookie` header value plus the response body. */
export async function startSession(
  app: INestApplication<App>,
): Promise<{ cookie: string; playerId: string }> {
  const response = await request(app.getHttpServer()).post('/api/session').expect(200);
  const header = response.headers['set-cookie'] as unknown as string[];
  const setCookie = header.find((value) => value.startsWith(`${SESSION_COOKIE}=`));
  if (!setCookie) throw new Error('Session cookie was not set');
  return { cookie: setCookie.split(';')[0], playerId: response.body.playerId as string };
}
