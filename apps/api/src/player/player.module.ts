import { Module } from '@nestjs/common';
import { SessionModule } from '../session/session.module.js';
import { PlayerController } from './player.controller.js';
import { PlayerService } from './player.service.js';

@Module({
  imports: [SessionModule],
  controllers: [PlayerController],
  providers: [PlayerService],
})
export class PlayerModule {}
