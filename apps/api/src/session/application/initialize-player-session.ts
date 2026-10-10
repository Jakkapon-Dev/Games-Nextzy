import { SESSION_TTL_MS } from '../domain/session.js';
import type { ResolvePlayerSession } from './resolve-player-session.js';
import type { SessionRepository, SessionTokens } from './session-ports.js';

export class InitializePlayerSession {
  constructor(
    private readonly repository: SessionRepository,
    private readonly tokens: SessionTokens,
    private readonly resolve: ResolvePlayerSession,
  ) {}

  async execute(rawToken: string | undefined, now = new Date()) {
    const existing = await this.resolve.execute(rawToken, now);
    if (existing) return { player: existing, newToken: undefined };
    const token = this.tokens.generate();
    const player = await this.repository.createPlayerWithSession(
      this.tokens.hash(token),
      new Date(now.getTime() + SESSION_TTL_MS),
    );
    return { player, newToken: token };
  }
}
