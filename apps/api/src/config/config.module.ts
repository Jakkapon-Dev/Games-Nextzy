import { Global, Module } from '@nestjs/common';
import { readEnv } from './env.js';

/** Injection token for the validated environment (see `Env`). */
export const ENV = Symbol('ENV');

@Global()
@Module({
  providers: [{ provide: ENV, useFactory: () => readEnv() }],
  exports: [ENV],
})
export class ConfigModule {}
