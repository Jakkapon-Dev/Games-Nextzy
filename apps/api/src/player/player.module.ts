import { Module } from '@nestjs/common';
import { SessionModule } from '../session/session.module.js';
import { PlayerController } from './presentation/player.controller.js';
import { GetPlayerProgress } from './application/get-player-progress.js';
import { ResetPlayerProgress } from './application/reset-player-progress.js';
import { PrismaPlayerProgressRepository } from './infrastructure/prisma-player-progress-repository.js';
import { ProgressPersistenceModule } from '../shared/infrastructure/progress-persistence.module.js';
import { PrismaProgressUnitOfWork } from '../shared/infrastructure/prisma-progress-unit-of-work.js';

@Module({
  imports: [SessionModule, ProgressPersistenceModule],
  controllers: [PlayerController],
  providers: [
    PrismaPlayerProgressRepository,
    {
      provide: GetPlayerProgress,
      inject: [PrismaPlayerProgressRepository],
      useFactory: (repository: PrismaPlayerProgressRepository) => new GetPlayerProgress(repository),
    },
    {
      provide: ResetPlayerProgress,
      inject: [PrismaProgressUnitOfWork],
      useFactory: (transactions: PrismaProgressUnitOfWork) => new ResetPlayerProgress(transactions),
    },
  ],
})
export class PlayerModule {}
