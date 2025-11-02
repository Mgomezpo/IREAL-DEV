import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Histogram,
  Counter,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();
  private readonly aiLatencyHistogram = new Histogram({
    name: 'ireal_service_ai_latency_ms',
    help: 'Latency in milliseconds for AI operations',
    labelNames: ['operation', 'status'],
    buckets: [100, 250, 500, 750, 1000, 2000, 5000, 10000],
    registers: [this.registry],
  });

  private readonly aiTokensCounter = new Counter({
    name: 'ireal_service_ai_tokens_total',
    help: 'Total tokens consumed by AI operations',
    labelNames: ['operation', 'model'],
    registers: [this.registry],
  });

  private readonly aiErrorCounter = new Counter({
    name: 'ireal_service_ai_errors_total',
    help: 'Total AI operation failures',
    labelNames: ['operation', 'reason'],
    registers: [this.registry],
  });
  private readonly httpDurationHistogram = new Histogram({
    name: 'ireal_service_http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [50, 100, 250, 500, 1000, 2000, 5000, 10000],
    registers: [this.registry],
  });

  private readonly httpRequestCounter = new Counter({
    name: 'ireal_service_http_requests_total',
    help: 'Total HTTP requests processed',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  onModuleInit() {
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'ireal_service_',
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  observeAiLatency(
    operation: string,
    status: 'success' | 'error',
    latencyMs: number,
  ) {
    this.aiLatencyHistogram.observe({ operation, status }, latencyMs);
  }

  incrementAiTokens(operation: string, model: string, tokens: number) {
    this.aiTokensCounter.inc({ operation, model }, tokens);
  }

  incrementAiErrors(operation: string, reason: string) {
    this.aiErrorCounter.inc({ operation, reason });
  }

  observeHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    latencyMs: number,
  ) {
    const statusLabel = String(statusCode);
    this.httpRequestCounter.inc({
      method,
      route,
      status_code: statusLabel,
    });
    this.httpDurationHistogram.observe(
      { method, route, status_code: statusLabel },
      latencyMs,
    );
  }
}
