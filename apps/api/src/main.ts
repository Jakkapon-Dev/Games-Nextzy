import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadEnvFile, readEnv } from './config/env.js';

async function bootstrap() {
  loadEnvFile();
  const env = readEnv();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(env.port);
}
await bootstrap();
