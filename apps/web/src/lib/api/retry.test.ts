import { describe, expect, it } from 'vitest';
import { ApiError } from './api-error';
import { shouldRetry } from './retry';

describe('shouldRetry', () => {
  it('retries network errors and server errors up to twice', () => {
    const network = new ApiError(0, 'NETWORK_ERROR', 'offline');
    const server = new ApiError(503, 'UNKNOWN_ERROR', 'unavailable');

    expect(shouldRetry(0, network)).toBe(true);
    expect(shouldRetry(1, server)).toBe(true);
    expect(shouldRetry(2, network)).toBe(false);
  });

  it('does not retry client errors', () => {
    expect(shouldRetry(0, new ApiError(409, 'CHECKPOINT_LOCKED', 'locked'))).toBe(false);
    expect(shouldRetry(0, new ApiError(401, 'SESSION_REQUIRED', 'no session'))).toBe(false);
  });

  it('does not retry unknown errors', () => {
    expect(shouldRetry(0, new Error('bug'))).toBe(false);
  });
});
