import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { createTestApp } from './support/create-test-app.js';
import { PrismaHealthProbe } from '../src/health/infrastructure/prisma-health-probe.js';

describe('GET /api/health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('reports ok without a session when the database is reachable', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns the same sanitized 503 contract when the probe fails', async () => {
    await app.close();
    app = await createTestApp((builder) =>
      builder.overrideProvider(PrismaHealthProbe).useValue({
        check: async () => {
          throw new Error('private connection details');
        },
      }),
    );
    const response = await request(app.getHttpServer()).get('/api/health').expect(503);
    expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
    expect(JSON.stringify(response.body)).not.toContain('private connection details');
  });
});
