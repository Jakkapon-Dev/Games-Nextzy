import { randomInt } from 'node:crypto';
import type { RandomSource } from '../domain/game-rules.js';

/** Cryptographically secure, uniformly distributed random integers. */
export class CryptoRandomSource implements RandomSource {
  int(maxExclusive: number): number {
    return randomInt(maxExclusive);
  }
}
