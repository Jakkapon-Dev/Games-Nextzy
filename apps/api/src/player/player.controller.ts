import { Controller, Get, UseGuards } from '@nestjs/common';
import type { Player } from '../generated/prisma/client.js';
import { CurrentPlayer, SessionGuard } from '../session/session.guard.js';
import type { PlayerProgressDto } from './dto/player-progress.dto.js';
import { PlayerService } from './player.service.js';

@Controller('me')
@UseGuards(SessionGuard)
export class PlayerController {
  constructor(private readonly players: PlayerService) {}

  @Get()
  getProgress(@CurrentPlayer() player: Player): Promise<PlayerProgressDto> {
    return this.players.getProgress(player);
  }
}
