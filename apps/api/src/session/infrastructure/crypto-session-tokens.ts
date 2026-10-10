import type { SessionTokens } from '../application/session-ports.js';
import { generateSessionToken, hashSessionToken } from './session-token.js';

export class CryptoSessionTokens implements SessionTokens {
  generate() {
    return generateSessionToken();
  }
  hash(token: string) {
    return hashSessionToken(token);
  }
}
