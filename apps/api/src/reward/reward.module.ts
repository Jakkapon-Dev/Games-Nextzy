import { Module } from '@nestjs/common';
import { SessionModule } from '../session/session.module.js';
import { RewardController } from './reward.controller.js';
import { RewardService } from './reward.service.js';

@Module({
  imports: [SessionModule],
  controllers: [RewardController],
  providers: [RewardService],
})
export class RewardModule {}
