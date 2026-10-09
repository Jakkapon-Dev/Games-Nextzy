import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import type { Player } from '../generated/prisma/client.js';
import { CurrentPlayer, SessionGuard } from '../session/session.guard.js';
import type { PlayedRoundDto } from './dto/game-round.dto.js';
import { PlayGameRoundDto } from './dto/play-game-round.dto.js';
import { GameService } from './game.service.js';

@Controller('game-rounds')
@UseGuards(SessionGuard)
export class GameController {
  constructor(private readonly game: GameService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  play(@CurrentPlayer() player: Player, @Body() body: PlayGameRoundDto): Promise<PlayedRoundDto> {
    return this.game.play(player.id, body);
  }
}
