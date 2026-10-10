import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { SessionRepository } from '../application/session-ports.js';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string) {
    const session = await this.prisma.playerSession.findUnique({
      where: { tokenHash },
      select: {
        expiresAt: true,
        player: { select: { id: true, totalScore: true, progressVersion: true } },
      },
    });
    return session ? { player: session.player, expiresAt: session.expiresAt } : null;
  }

  createPlayerWithSession(tokenHash: string, expiresAt: Date) {
    // Nested write creates both records atomically.
    return this.prisma.player.create({
      data: { sessions: { create: { tokenHash, expiresAt } } },
      select: { id: true, totalScore: true, progressVersion: true },
    });
  }
}
