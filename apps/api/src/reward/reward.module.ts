import { Module } from '@nestjs/common';
import { SessionModule } from '../session/session.module.js';
import { RewardController } from './presentation/reward.controller.js';
import { ClaimCheckpointReward } from './application/claim-checkpoint-reward.js';
import { GetRewardHistory } from './application/get-reward-history.js';
import { PrismaRewardHistoryRepository } from './infrastructure/prisma-reward-history-repository.js';
import { ProgressPersistenceModule } from '../shared/infrastructure/progress-persistence.module.js';
import { PrismaProgressUnitOfWork } from '../shared/infrastructure/prisma-progress-unit-of-work.js';

@Module({
  imports: [SessionModule, ProgressPersistenceModule],
  controllers: [RewardController],
  providers: [
    PrismaRewardHistoryRepository,
    {
      provide: ClaimCheckpointReward,
      inject: [PrismaProgressUnitOfWork],
      useFactory: (transactions: PrismaProgressUnitOfWork) =>
        new ClaimCheckpointReward(transactions),
    },
    {
      provide: GetRewardHistory,
      inject: [PrismaRewardHistoryRepository],
      useFactory: (repository: PrismaRewardHistoryRepository) => new GetRewardHistory(repository),
    },
  ],
})
export class RewardModule {}
