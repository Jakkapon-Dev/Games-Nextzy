import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import type { Player } from '../domain/player.js';
import { CurrentPlayer, SessionGuard } from '../../session/presentation/session.guard.js';
import type { PlayerProgressDto } from './dto/player-progress.dto.js';
import { type ProgressResetDto, ResetProgressDto } from './dto/reset-progress.dto.js';
import { GetPlayerProgress } from '../application/get-player-progress.js';
import { ResetPlayerProgress } from '../application/reset-player-progress.js';

@Controller('me')
@UseGuards(SessionGuard)
export class PlayerController {
  constructor(
    private readonly getPlayerProgress: GetPlayerProgress,
    private readonly resetProgress: ResetPlayerProgress,
  ) {}

  @Get()
  getProgress(@CurrentPlayer() player: Player): Promise<PlayerProgressDto> {
    return this.getPlayerProgress.execute(player);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  reset(
    @CurrentPlayer() player: Player,
    @Body() body: ResetProgressDto,
  ): Promise<ProgressResetDto> {
    return this.resetProgress.execute(player.id, body);
  }
}
