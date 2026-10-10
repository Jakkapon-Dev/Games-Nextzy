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
    super({
      adapter: new PrismaPg({
        connectionString: readEnv().databaseUrl,
        // Prisma reads and writes timestamps as UTC. Pin the session time zone so a database
        // server configured for another zone (e.g. Asia/Bangkok) does not shift stored values.
        options: '-c TimeZone=UTC',
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
