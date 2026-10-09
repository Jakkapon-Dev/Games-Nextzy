import { Module } from '@nestjs/common';
import { SessionModule } from '../session/session.module.js';
import { GameController } from './game.controller.js';
import { RANDOM_SOURCE } from './game.constants.js';
import { GameService } from './game.service.js';
import { CryptoRandomSource } from './infrastructure/crypto-random-source.js';

@Module({
  imports: [SessionModule],
  controllers: [GameController],
  providers: [GameService, { provide: RANDOM_SOURCE, useClass: CryptoRandomSource }],
})
export class GameModule {}
