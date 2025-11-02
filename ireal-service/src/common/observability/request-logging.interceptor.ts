import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';
import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import { STRUCTURED_LOGGER } from './structured-logger.provider';
import { hashUserIdentifier } from './hash.util';
import { ErrorReporterService } from './error-reporter.service';

const REQUEST_ID_HEADER = 'x-request-id';
const USER_ID_HEADER = 'x-user-id';

const getRoutePath = (req: Request): string | undefined => {
  const maybeRoute = (req as { route?: unknown }).route;
  if (
    typeof maybeRoute === 'object' &&
    maybeRoute !== null &&
    typeof (maybeRoute as { path?: unknown }).path === 'string'
  ) {
    return (maybeRoute as { path: string }).path;
  }
  return undefined;
};

const resolveRoute = (req: Request): string => {
  const routePath = getRoutePath(req);
  if (routePath) {
    return routePath;
  }
  return req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(STRUCTURED_LOGGER) private readonly logger: Logger,
    private readonly errorReporter: ErrorReporterService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = performance.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const requestId =
      (request.headers[REQUEST_ID_HEADER] as string | undefined) ?? 'unknown';
    const rawUserId = request.headers[USER_ID_HEADER] as string | undefined;
    const userIdHash = rawUserId ? hashUserIdentifier(rawUserId) : undefined;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    const route = resolveRoute(request);
    const method = request.method;

    return next.handle().pipe(
      tap(() => {
        const latencyMs = Math.round(performance.now() - now);
        this.logger.info(
          {
            event: 'http_request',
            requestId,
            userIdHash,
            method,
            route,
            status: response.statusCode,
            latencyMs,
          },
          'HTTP request completed',
        );
      }),
      catchError((error) => {
        const latencyMs = Math.round(performance.now() - now);
        const status =
          response.statusCode && response.statusCode >= 400
            ? response.statusCode
            : 500;

        this.logger.error(
          {
            event: 'http_error',
            requestId,
            userIdHash,
            method,
            route,
            status,
            latencyMs,
            error:
              error instanceof Error
                ? { name: error.name, message: error.message }
                : { message: String(error) },
          },
          'HTTP request failed',
        );

        this.errorReporter.report(error, {
          requestId,
          userIdHash,
          method,
          route,
          status,
          latencyMs,
        });

        throw error;
      }),
    );
  }
}
