/** Raised when a request body or query fails validation. */
export class RequestValidationError extends Error {
  constructor(message = 'ข้อมูลคำขอไม่ถูกต้อง') {
    super(message);
    this.name = 'RequestValidationError';
  }
}
