import type { CookieOptions } from 'express';

export const SESSION_COOKIE_NAME = 'nextzy_session';
export const SESSION_TTL_MS = 180 * 24 * 60 * 60 * 1000;

/** Cookie settings for the session token. `Secure` is only set in production (HTTPS). */
export function sessionCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: SESSION_TTL_MS,
  };
}
