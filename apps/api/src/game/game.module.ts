import { Module } from '@nestjs/common';
import { SessionModule } from '../session/session.module.js';
import { GameController } from './presentation/game.controller.js';
import { RANDOM_SOURCE } from './game.constants.js';
import { PlayGameRound } from './application/play-game-round.js';
import { GetGameHistory } from './application/get-game-history.js';
import type { RandomSource } from './domain/game-rules.js';
import { PrismaGameHistoryRepository } from './infrastructure/prisma-game-history-repository.js';
import { ProgressPersistenceModule } from '../shared/infrastructure/progress-persistence.module.js';
import { PrismaProgressUnitOfWork } from '../shared/infrastructure/prisma-progress-unit-of-work.js';
import { CryptoRandomSource } from './infrastructure/crypto-random-source.js';

@Module({
  imports: [SessionModule, ProgressPersistenceModule],
  controllers: [GameController],
  providers: [
    PrismaGameHistoryRepository,
    { provide: RANDOM_SOURCE, useClass: CryptoRandomSource },
    {
      provide: PlayGameRound,
      inject: [PrismaProgressUnitOfWork, RANDOM_SOURCE],
      useFactory: (transactions: PrismaProgressUnitOfWork, random: RandomSource) =>
        new PlayGameRound(transactions, random),
    },
    {
      provide: GetGameHistory,
      inject: [PrismaGameHistoryRepository],
      useFactory: (repository: PrismaGameHistoryRepository) => new GetGameHistory(repository),
    },
  ],
})
export class GameModule {}
