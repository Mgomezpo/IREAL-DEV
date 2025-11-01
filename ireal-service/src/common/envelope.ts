import { randomUUID } from 'node:crypto';
import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  requestId: string;
  latencyMs?: number;
  provider?: string;
  model?: string;
  tokens?: number;
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}

export const buildMeta = (meta?: Partial<ApiMeta>): ApiMeta => ({
  requestId: randomUUID(),
  ...meta,
});

export const buildSuccess = <T>(
  data: T,
  meta?: Partial<ApiMeta>,
): ApiEnvelope<T> => ({
  data,
  error: null,
  meta: buildMeta(meta),
});

export class ApiHttpException extends HttpException {
  constructor(
    code: string,
    message: string,
    status: HttpStatus,
    meta?: Partial<ApiMeta>,
    details?: Record<string, unknown>,
  ) {
    super(
      {
        data: null,
        error: {
          code,
          message,
          details,
        },
        meta: buildMeta(meta),
      },
      status,
    );
  }
}
