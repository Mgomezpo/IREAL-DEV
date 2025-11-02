import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiHttpException } from '../envelope';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ApiHttpException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse() as
        | string
        | { message?: string | string[] };

      const message =
        typeof payload === 'string'
          ? payload
          : Array.isArray(payload?.message)
            ? payload.message.join(', ')
            : (payload?.message ?? exception.message ?? 'Unexpected error');

      const apiError = new ApiHttpException('HTTP_ERROR', message, status);
      response.status(status).json(apiError.getResponse());
      return;
    }

    const error = exception as Error;
    this.logger.error(
      error?.message ?? 'Unhandled error',
      error?.stack ?? 'no-stack',
    );

    const apiError = new ApiHttpException(
      'INTERNAL_SERVER_ERROR',
      'Unexpected server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    response.status(apiError.getStatus()).json(apiError.getResponse());
  }
}
