import { SESSION_TTL_MS } from '../domain/session.js';
import { InitializePlayerSession } from './initialize-player-session.js';
import { ResolvePlayerSession } from './resolve-player-session.js';

const now = new Date('2026-10-10T10:00:00.000Z');
const player = { id: 'player', totalScore: 3000, progressVersion: 2 };

function fixture() {
  const repository = {
    findByTokenHash: vi.fn().mockResolvedValue(null),
    createPlayerWithSession: vi
      .fn()
      .mockResolvedValue({ ...player, totalScore: 0, progressVersion: 1 }),
  };
  const tokens = {
    generate: vi.fn().mockReturnValue('new-token'),
    hash: vi.fn((token: string) => `hash:${token}`),
  };
  const resolve = new ResolvePlayerSession(repository, tokens);
  return {
    repository,
    tokens,
    resolve,
    initialize: new InitializePlayerSession(repository, tokens, resolve),
  };
}

describe('session use cases without a database or crypto implementation', () => {
  it('does not query storage for a missing token', async () => {
    const f = fixture();
    expect(await f.resolve.execute(undefined, now)).toBeNull();
    expect(f.repository.findByTokenHash).not.toHaveBeenCalled();
  });

  it('resolves a usable session by hash rather than the raw token', async () => {
    const f = fixture();
    f.repository.findByTokenHash.mockResolvedValue({
      player,
      expiresAt: new Date(now.getTime() + 1),
    });
    expect(await f.resolve.execute('existing-token', now)).toEqual(player);
    expect(f.repository.findByTokenHash).toHaveBeenCalledWith('hash:existing-token');
  });

  it.each([-1, 0])('rejects expiration at or before now (%s ms)', async (offset) => {
    const f = fixture();
    f.repository.findByTokenHash.mockResolvedValue({
      player,
      expiresAt: new Date(now.getTime() + offset),
    });
    expect(await f.resolve.execute('expired', now)).toBeNull();
  });

  it('returns null for an unknown session', async () => {
    expect(await fixture().resolve.execute('unknown', now)).toBeNull();
  });

  it('reuses a valid player without creating a token or resetting their progress', async () => {
    const f = fixture();
    f.repository.findByTokenHash.mockResolvedValue({
      player,
      expiresAt: new Date(now.getTime() + 1),
    });
    expect(await f.initialize.execute('existing', now)).toEqual({ player, newToken: undefined });
    expect(f.tokens.generate).not.toHaveBeenCalled();
    expect(f.repository.createPlayerWithSession).not.toHaveBeenCalled();
  });

  it('creates a player and stores only the hash with the domain-defined lifetime', async () => {
    const f = fixture();
    expect(await f.initialize.execute(undefined, now)).toEqual({
      player: { ...player, totalScore: 0, progressVersion: 1 },
      newToken: 'new-token',
    });
    expect(f.repository.createPlayerWithSession).toHaveBeenCalledWith(
      'hash:new-token',
      new Date(now.getTime() + SESSION_TTL_MS),
    );
  });

  it('creates a fresh session for an expired token', async () => {
    const f = fixture();
    f.repository.findByTokenHash.mockResolvedValue({ player, expiresAt: now });
    expect(await f.initialize.execute('expired', now)).toMatchObject({ newToken: 'new-token' });
    expect(f.repository.createPlayerWithSession).toHaveBeenCalledOnce();
  });

  it('propagates storage failure instead of issuing an unusable cookie', async () => {
    const f = fixture();
    const error = new Error('database unavailable');
    f.repository.createPlayerWithSession.mockRejectedValue(error);
    await expect(f.initialize.execute(undefined, now)).rejects.toBe(error);
  });
});
