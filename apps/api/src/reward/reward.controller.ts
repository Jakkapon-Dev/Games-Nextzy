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
import { type Paginated, PaginationQueryDto } from '../common/http/pagination.dto.js';
import type { Player } from '../generated/prisma/client.js';
import { CurrentPlayer, SessionGuard } from '../session/session.guard.js';
import { ClaimRewardDto } from './dto/claim-reward.dto.js';
import type { ClaimedRewardDto, RewardHistoryItemDto } from './dto/reward-claim.dto.js';
import { RewardService } from './reward.service.js';

@Controller()
@UseGuards(SessionGuard)
export class RewardController {
  constructor(private readonly rewards: RewardService) {}

  @Post('checkpoints/:id/claim')
  @HttpCode(HttpStatus.OK)
  claim(
    @CurrentPlayer() player: Player,
    @Param('id') checkpointId: string,
    @Body() body: ClaimRewardDto,
  ): Promise<ClaimedRewardDto> {
    return this.rewards.claim(player.id, checkpointId, body);
  }

  @Get('reward-claims')
  history(
    @CurrentPlayer() player: Player,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<RewardHistoryItemDto>> {
    return this.rewards.history(player, query);
  }
}
