import { HttpException, HttpStatus } from '@nestjs/common';
import { DomainError, DomainErrorCode } from '../errors/domain-error.js';
import { RequestValidationError } from '../errors/request-validation.error.js';

export interface ErrorBody {
  code: string;
  message: string;
}

export interface ErrorResponse {
  status: number;
  body: ErrorBody;
}

const DOMAIN_STATUS: Record<DomainErrorCode, HttpStatus> = {
  SESSION_REQUIRED: HttpStatus.UNAUTHORIZED,
  CHECKPOINT_NOT_FOUND: HttpStatus.NOT_FOUND,
  CHECKPOINT_LOCKED: HttpStatus.CONFLICT,
  REWARD_ALREADY_CLAIMED: HttpStatus.CONFLICT,
  PROGRESS_VERSION_MISMATCH: HttpStatus.CONFLICT,
};

const INTERNAL_ERROR: ErrorResponse = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  body: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง' },
};

/** Maps any thrown value to the API error format `{ code, message }`. */
export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof DomainError) {
    return {
      status: DOMAIN_STATUS[exception.code],
      body: { code: exception.code, message: exception.message },
    };
  }

  if (exception instanceof RequestValidationError) {
    return {
      status: HttpStatus.BAD_REQUEST,
      body: { code: 'VALIDATION_ERROR', message: exception.message },
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status === HttpStatus.BAD_REQUEST) {
      return { status, body: { code: 'VALIDATION_ERROR', message: 'ข้อมูลคำขอไม่ถูกต้อง' } };
    }
    if (status === HttpStatus.NOT_FOUND) {
      return { status, body: { code: 'NOT_FOUND', message: 'ไม่พบเส้นทางที่ร้องขอ' } };
    }
    if (status < 500) {
      return {
        status,
        body: {
          code: HttpStatus[status] ?? 'REQUEST_ERROR',
          message: 'ไม่สามารถดำเนินการคำขอนี้ได้',
        },
      };
    }
  }

  return INTERNAL_ERROR;
}
