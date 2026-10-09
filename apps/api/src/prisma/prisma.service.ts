import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { readEnv } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma Client backed by the pg driver adapter.
 * The connection is opened lazily on the first query.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: readEnv().databaseUrl }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
