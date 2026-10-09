import { sessionCookieOptions, SESSION_TTL_MS } from './session-cookie.js';
import { generateSessionToken, hashSessionToken } from './session-token.js';

describe('session token', () => {
  it('generates unique, URL-safe tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSessionToken()));
    expect(tokens.size).toBe(100);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
  });

  it('hashes deterministically without revealing the token', () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(token)).not.toContain(token);
  });
});

describe('sessionCookieOptions', () => {
  it('uses HttpOnly, SameSite=Lax, root path and a 180-day lifetime', () => {
    expect(sessionCookieOptions(false)).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: SESSION_TTL_MS,
    });
    expect(SESSION_TTL_MS).toBe(180 * 24 * 60 * 60 * 1000);
  });

  it('marks the cookie Secure in production', () => {
    expect(sessionCookieOptions(true).secure).toBe(true);
  });
});
