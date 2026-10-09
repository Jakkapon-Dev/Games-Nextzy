import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { DomainError } from '../errors/domain-error.js';
import { RequestValidationError } from '../errors/request-validation.error.js';
import { toErrorResponse } from './error-response.js';

describe('toErrorResponse', () => {
  it.each([
    ['SESSION_REQUIRED', 401],
    ['CHECKPOINT_NOT_FOUND', 404],
    ['CHECKPOINT_LOCKED', 409],
    ['REWARD_ALREADY_CLAIMED', 409],
    ['PROGRESS_VERSION_MISMATCH', 409],
  ] as const)('maps domain error %s to HTTP %i', (code, status) => {
    const result = toErrorResponse(new DomainError(code));
    expect(result.status).toBe(status);
    expect(result.body.code).toBe(code);
    expect(result.body.message).not.toBe('');
  });

  it('keeps a custom domain error message', () => {
    expect(toErrorResponse(new DomainError('CHECKPOINT_LOCKED', 'custom')).body.message).toBe(
      'custom',
    );
  });

  it('maps request validation errors to 400 VALIDATION_ERROR with the given message', () => {
    expect(toErrorResponse(new RequestValidationError('requestId ต้องเป็น UUID'))).toEqual({
      status: 400,
      body: { code: 'VALIDATION_ERROR', message: 'requestId ต้องเป็น UUID' },
    });
  });

  it('maps framework 400 errors such as malformed JSON to VALIDATION_ERROR', () => {
    const result = toErrorResponse(new BadRequestException('Unexpected token } in JSON'));
    expect(result.status).toBe(400);
    expect(result.body.code).toBe('VALIDATION_ERROR');
    expect(result.body.message).not.toContain('JSON');
  });

  it('maps unknown routes to 404 NOT_FOUND', () => {
    expect(toErrorResponse(new NotFoundException('Cannot GET /api/x')).body).toEqual({
      code: 'NOT_FOUND',
      message: 'ไม่พบเส้นทางที่ร้องขอ',
    });
  });

  it('uses the HTTP status name as the code for other client errors', () => {
    const result = toErrorResponse(new PayloadTooLargeException());
    expect(result.status).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(result.body.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('hides details of unexpected errors behind 500 INTERNAL_ERROR', () => {
    const result = toErrorResponse(new Error('connection string postgresql://secret'));
    expect(result.status).toBe(500);
    expect(result.body.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(result.body)).not.toContain('secret');
  });
});
