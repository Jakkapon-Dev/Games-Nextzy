import type { Player } from '../../player/domain/player.js';

export interface SessionRepository {
  findByTokenHash(tokenHash: string): Promise<{ player: Player; expiresAt: Date } | null>;
  createPlayerWithSession(tokenHash: string, expiresAt: Date): Promise<Player>;
}

export interface SessionTokens {
  generate(): string;
  hash(token: string): string;
}
