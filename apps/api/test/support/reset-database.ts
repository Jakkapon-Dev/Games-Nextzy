import type { PrismaService } from '../../src/prisma/prisma.service.js';

/** Removes all player data between tests. Reference data such as checkpoints is kept. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "player_sessions", "players" CASCADE');
}
