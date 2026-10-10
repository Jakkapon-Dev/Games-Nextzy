import type { CookieOptions } from 'express';

export const SESSION_COOKIE_NAME = 'nextzy_session';
import { SESSION_TTL_MS } from '../domain/session.js';
export { SESSION_TTL_MS } from '../domain/session.js';

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
