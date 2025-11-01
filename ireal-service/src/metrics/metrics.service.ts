import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();

  onModuleInit() {
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'ireal_service_',
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
