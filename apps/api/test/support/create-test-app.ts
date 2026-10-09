import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';

/**
 * Boots the full application with the same HTTP configuration as the server.
 * `customize` can override providers, e.g. to make random results predictable.
 */
export async function createTestApp(
  customize: (builder: TestingModuleBuilder) => TestingModuleBuilder = (builder) => builder,
): Promise<INestApplication<App>> {
  const moduleFixture = await customize(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();
  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  configureApp(app);
  // Listen once on a random port so concurrent requests share one server.
  await app.listen(0);
  return app;
}
