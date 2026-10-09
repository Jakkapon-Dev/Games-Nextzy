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
import { type Paginated, PaginationQueryDto } from '../common/http/pagination.dto.js';
import type { Player } from '../generated/prisma/client.js';
import { CurrentPlayer, SessionGuard } from '../session/session.guard.js';
import type { GameHistoryItemDto, PlayedRoundDto } from './dto/game-round.dto.js';
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

  @Get()
  history(
    @CurrentPlayer() player: Player,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<GameHistoryItemDto>> {
    return this.game.history(player, query);
  }
}
