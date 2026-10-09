import { Injectable } from '@nestjs/common';
import type { Player } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SESSION_TTL_MS } from './session-cookie.js';
import { generateSessionToken, hashSessionToken } from './session-token.js';

export interface InitializedSession {
  player: Player;
  /** Raw token to send as a cookie; present only when a new session was created. */
  newToken?: string;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the player of a usable session, or `null` when the token is missing, unknown or expired. */
  async findPlayer(rawToken: string | undefined, now = new Date()): Promise<Player | null> {
    if (!rawToken) return null;
    const session = await this.prisma.playerSession.findUnique({
      where: { tokenHash: hashSessionToken(rawToken) },
      include: { player: true },
    });
    return session && session.expiresAt > now ? session.player : null;
  }

  /**
   * Reuses the player of a usable session. Otherwise creates a new player with a new session;
   * an existing player's data is never reset.
   */
  async initialize(rawToken: string | undefined, now = new Date()): Promise<InitializedSession> {
    const existing = await this.findPlayer(rawToken, now);
    if (existing) return { player: existing };

    const token = generateSessionToken();
    const player = await this.prisma.player.create({
      data: {
        sessions: {
          create: {
            tokenHash: hashSessionToken(token),
            expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
          },
        },
      },
    });
    return { player, newToken: token };
  }
}
