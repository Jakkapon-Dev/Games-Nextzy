import type { Player } from '../../player/domain/player.js';
import type { SessionRepository, SessionTokens } from './session-ports.js';

export class ResolvePlayerSession {
  constructor(
    private readonly repository: SessionRepository,
    private readonly tokens: SessionTokens,
  ) {}

  async execute(rawToken: string | undefined, now = new Date()): Promise<Player | null> {
    if (!rawToken) return null;
    const session = await this.repository.findByTokenHash(this.tokens.hash(rawToken));
    return session && session.expiresAt > now ? session.player : null;
  }
}
