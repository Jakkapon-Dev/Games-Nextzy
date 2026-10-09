import { INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';
import { RequestValidationError } from './common/errors/request-validation.error.js';
import { HttpExceptionFilter } from './common/http/http-exception.filter.js';

function firstConstraintMessage(errors: ValidationError[]): string | undefined {
  for (const error of errors) {
    const message = Object.values(error.constraints ?? {})[0];
    if (message) return message;
    const nested = firstConstraintMessage(error.children ?? []);
    if (nested) return nested;
  }
  return undefined;
}

/** Shared HTTP configuration used by the server and the e2e tests. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => new RequestValidationError(firstConstraintMessage(errors)),
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
