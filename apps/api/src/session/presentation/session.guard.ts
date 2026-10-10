import { CanActivate, createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { DomainError } from '../../shared/domain/domain-error.js';
import type { Player } from '../../player/domain/player.js';
import { SESSION_COOKIE_NAME } from './session-cookie.js';
import { ResolvePlayerSession } from '../application/resolve-player-session.js';

type RequestWithPlayer = Request & { player?: Player };

/** Requires a valid session cookie and attaches its player to the request. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: ResolvePlayerSession) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithPlayer>();
    const token = request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    const player = await this.sessions.execute(token);
    if (!player) {
      throw new DomainError('SESSION_REQUIRED');
    }
    request.player = player;
    return true;
  }
}

/** The player resolved by `SessionGuard`. */
export const CurrentPlayer = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const player = context.switchToHttp().getRequest<RequestWithPlayer>().player;
  if (!player) {
    throw new DomainError('SESSION_REQUIRED');
  }
  return player;
});
