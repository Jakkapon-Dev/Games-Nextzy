import { ApiError, NETWORK_ERROR } from './api-error';

const MAX_RETRIES = 2;

/**
 * Retries only failures that may succeed on a second attempt: network errors and 5xx responses.
 * Client errors (4xx) are final; the API client already handles a missing session itself.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (!(error instanceof ApiError)) return false;
  return error.code === NETWORK_ERROR || error.status >= 500;
}
