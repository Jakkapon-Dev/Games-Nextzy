import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { type Paginated, PaginationQueryDto } from '../../common/http/pagination.dto.js';
import type { Player } from '../../player/domain/player.js';
import { CurrentPlayer, SessionGuard } from '../../session/presentation/session.guard.js';
import { ClaimRewardDto } from './dto/claim-reward.dto.js';
import type { ClaimedRewardDto, RewardHistoryItemDto } from './dto/reward-claim.dto.js';
import { ClaimCheckpointReward } from '../application/claim-checkpoint-reward.js';
import { GetRewardHistory } from '../application/get-reward-history.js';

@Controller()
@UseGuards(SessionGuard)
export class RewardController {
  constructor(
    private readonly claimReward: ClaimCheckpointReward,
    private readonly getHistory: GetRewardHistory,
  ) {}

  @Post('checkpoints/:id/claim')
  @HttpCode(HttpStatus.OK)
  claim(
    @CurrentPlayer() player: Player,
    @Param('id') checkpointId: string,
    @Body() body: ClaimRewardDto,
  ): Promise<ClaimedRewardDto> {
    return this.claimReward.execute(player.id, checkpointId, body);
  }

  @Get('reward-claims')
  history(
    @CurrentPlayer() player: Player,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<RewardHistoryItemDto>> {
    return this.getHistory.execute(player, query);
  }
}
