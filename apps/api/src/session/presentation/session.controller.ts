import { Controller, HttpCode, HttpStatus, Inject, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ENV } from '../../config/config.module.js';
import type { Env } from '../../config/env.js';
import type { PlayerSessionDto } from './dto/player-session.dto.js';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from './session-cookie.js';
import { InitializePlayerSession } from '../application/initialize-player-session.js';

@Controller('session')
export class SessionController {
  constructor(
    private readonly sessions: InitializePlayerSession,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async initialize(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PlayerSessionDto> {
    const token = request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    const { player, newToken } = await this.sessions.execute(token);
    if (newToken) {
      response.cookie(SESSION_COOKIE_NAME, newToken, sessionCookieOptions(this.env.isProduction));
    }
    return {
      playerId: player.id,
      totalScore: player.totalScore,
      progressVersion: player.progressVersion,
    };
  }
}
