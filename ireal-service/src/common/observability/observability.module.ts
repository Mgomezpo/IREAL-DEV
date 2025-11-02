import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '../../metrics/metrics.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import {
  STRUCTURED_LOGGER,
  structuredLoggerProvider,
} from './structured-logger.provider';
import { ErrorReporterService } from './error-reporter.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { HttpMetricsMiddleware } from './http-metrics.middleware';

@Module({
  imports: [ConfigModule, MetricsModule, RateLimitModule],
  providers: [
    structuredLoggerProvider,
    ErrorReporterService,
    RequestLoggingInterceptor,
    HttpMetricsMiddleware,
  ],
  exports: [
    STRUCTURED_LOGGER,
    ErrorReporterService,
    RequestLoggingInterceptor,
    HttpMetricsMiddleware,
  ],
})
export class ObservabilityModule {}
