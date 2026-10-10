import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { type Paginated, PaginationQueryDto } from '../../common/http/pagination.dto.js';
import type { Player } from '../../player/domain/player.js';
import { CurrentPlayer, SessionGuard } from '../../session/presentation/session.guard.js';
import type { GameHistoryItemDto, PlayedRoundDto } from './dto/game-round.dto.js';
import { PlayGameRoundDto } from './dto/play-game-round.dto.js';
import { PlayGameRound } from '../application/play-game-round.js';
import { GetGameHistory } from '../application/get-game-history.js';

@Controller('game-rounds')
@UseGuards(SessionGuard)
export class GameController {
  constructor(
    private readonly playRound: PlayGameRound,
    private readonly getHistory: GetGameHistory,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  play(@CurrentPlayer() player: Player, @Body() body: PlayGameRoundDto): Promise<PlayedRoundDto> {
    return this.playRound.execute(player.id, body);
  }

  @Get()
  history(
    @CurrentPlayer() player: Player,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<GameHistoryItemDto>> {
    return this.getHistory.execute(player, query);
  }
}
