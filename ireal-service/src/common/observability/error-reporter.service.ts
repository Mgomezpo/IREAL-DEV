import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Logger } from 'pino';
import { STRUCTURED_LOGGER } from './structured-logger.provider';

export interface ErrorReportContext {
  requestId?: string;
  userIdHash?: string;
  route?: string;
  method?: string;
  status?: number;
  latencyMs?: number;
}

@Injectable()
export class ErrorReporterService {
  private readonly sampleRate: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(STRUCTURED_LOGGER) private readonly logger: Logger,
  ) {
    const configuredRate =
      this.configService.get<number>('ERROR_LOG_SAMPLE_RATE', 0.1) ?? 0.1;
    this.sampleRate = Math.min(Math.max(configuredRate, 0), 1);
  }

  report(error: unknown, context: ErrorReportContext): void {
    if (this.sampleRate === 0) {
      return;
    }

    if (Math.random() > this.sampleRate) {
      return;
    }

    const err = error instanceof Error ? error : new Error(String(error));
    this.logger.warn(
      {
        event: 'error.reported',
        requestId: context.requestId,
        userIdHash: context.userIdHash,
        route: context.route,
        method: context.method,
        status: context.status,
        latencyMs: context.latencyMs,
        error: {
          name: err.name,
          message: err.message,
        },
      },
      'Sampled error reported',
    );
  }
}
