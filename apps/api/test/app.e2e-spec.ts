import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('responds with the standard error body for an unknown route', async () => {
    const response = await request(app.getHttpServer()).get('/api/unknown').expect(404);
    expect(response.body).toEqual({ code: 'NOT_FOUND', message: 'ไม่พบเส้นทางที่ร้องขอ' });
  });

  it('responds with VALIDATION_ERROR for a malformed JSON body', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/unknown')
      .set('Content-Type', 'application/json')
      .send('{"progressVersion": ')
      .expect(400);
    expect(response.body).toEqual({ code: 'VALIDATION_ERROR', message: 'ข้อมูลคำขอไม่ถูกต้อง' });
  });

  it('runs against the dedicated test database with migrated reference data', async () => {
    const prisma = app.get(PrismaService);
    const [{ current_database: database }] = await prisma.$queryRaw<
      { current_database: string }[]
    >`SELECT current_database()`;
    expect(database).toMatch(/_test$/);
    expect(await prisma.checkpoint.count()).toBe(3);
  });

  afterEach(async () => {
    await app.close();
  });
});
