import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../../metrics/metrics.service';

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
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1_000_000;
      const status = res.statusCode;
      const route = resolveRoute(req);

      this.metricsService.observeHttpRequest(
        req.method,
        route,
        status,
        latencyMs,
      );
    });

    next();
  }
}
