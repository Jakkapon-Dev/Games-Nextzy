/** Error returned by the API (`{ code, message }`) or raised when the request could not be made. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const NETWORK_ERROR = 'NETWORK_ERROR';
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR';
