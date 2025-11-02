import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, Request, Response, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { createValidationPipe } from './common/pipes/api-validation.pipe';
import { getAppVersion } from './common/version.util';
import { correlationMiddleware } from './common/observability/correlation.middleware';
import { HttpMetricsMiddleware } from './common/observability/http-metrics.middleware';
import { RequestLoggingInterceptor } from './common/observability/request-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
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

  await app.listen(port);

  Logger.log(`ireal-service running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  Logger.error('Failed to bootstrap application', error);
  process.exit(1);
});
