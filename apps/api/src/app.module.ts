import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { PlayerModule } from './player/player.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SessionModule } from './session/session.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, SessionModule, PlayerModule],
})
export class AppModule {}
