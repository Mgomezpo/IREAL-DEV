import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, {
  json,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  urlencoded,
} from 'express';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { correlationMiddleware } from '../src/common/observability/correlation.middleware';
import { HttpMetricsMiddleware } from '../src/common/observability/http-metrics.middleware';
import { RequestLoggingInterceptor } from '../src/common/observability/request-logging.interceptor';
import { createValidationPipe } from '../src/common/pipes/api-validation.pipe';
import { getAppVersion } from '../src/common/version.util';

let cachedHandler: RequestHandler | undefined;

async function bootstrapServer(): Promise<RequestHandler> {
  const expressInstance = express();
  const adapter = new ExpressAdapter(expressInstance);
  // Avoid accessing deprecated app.router during init checks (Express 4+ lambda env).
  // Vercel's runtime warns/crashes if app.router is read; override the check.
  (adapter as any).isMiddlewareApplied = () => false;

  const app = await NestFactory.create(AppModule, adapter, {
    bufferLogs: true,
  });

  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true }));
  app.use(correlationMiddleware);

  const httpMetricsMiddleware = app.get(HttpMetricsMiddleware);
  app.use(httpMetricsMiddleware.use.bind(httpMetricsMiddleware));

  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());

  const requestLoggingInterceptor = app.get(RequestLoggingInterceptor);
  app.useGlobalInterceptors(requestLoggingInterceptor);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3333);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('IREAL Service API')
    .setDescription('Versioned API for the decoupled IREAL backend service.')
    .setVersion(getAppVersion())
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  app.use('/v1/openapi.json', (_req: Request, res: Response) => {
    res.type('application/json').send(document);
  });

  await app.init();

  Logger.log(`ireal-service (serverless) initialised on port ${port}`, 'Bootstrap');

  // ExpressAdapter wraps the underlying express instance; we reuse it as a handler.
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: Request, res: Response) {
  if (!cachedHandler) {
    cachedHandler = await bootstrapServer();
  }

  try {
    return cachedHandler?.(req, res, (err?: unknown) => {
      if (err) {
        Logger.error('Request handler error', err);
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error');
        }
      }
    });
  } catch (err) {
    Logger.error('Request handler threw', err);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
}
