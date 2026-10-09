import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { GameModule } from './game/game.module.js';
import { PlayerModule } from './player/player.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RewardModule } from './reward/reward.module.js';
import { SessionModule } from './session/session.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, SessionModule, PlayerModule, GameModule, RewardModule],
})
export class AppModule {}
