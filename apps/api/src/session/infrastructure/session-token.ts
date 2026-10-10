import { createHash, randomBytes } from 'node:crypto';

/** Creates an opaque, unguessable session token for the cookie. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Hash stored in the database so a leaked row cannot be used as a cookie. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
