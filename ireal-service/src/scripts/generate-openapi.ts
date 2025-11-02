import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import YAML from 'yaml';
import { AppModule } from '../app.module';
import { getAppVersion } from '../common/version.util';

async function generate() {
  console.log('Generating OpenAPI spec...');
  const app = await NestFactory.create(AppModule, { logger: false });

  console.log('Nest application bootstrapped');
  const config = new DocumentBuilder()
    .setTitle('IREAL Service API')
    .setDescription('Versioned API for the decoupled IREAL backend service.')
    .setVersion(getAppVersion())
    .build();

  console.log('Swagger configuration built');
  const document = SwaggerModule.createDocument(app, config);
  const yaml = YAML.stringify(document);
  const outputDir = join(__dirname, '..', '..', '..', 'docs', 'api');

  console.log('Writing OpenAPI spec to disk');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, 'openapi.yaml');
  writeFileSync(outputPath, yaml, 'utf-8');

  await app.close();
  console.log('OpenAPI spec generated successfully');
}

generate().catch((error) => {
  const message =
    error instanceof Error
      ? `${error.message}\n${error.stack ?? ''}`
      : String(error);
  console.error('Failed to generate OpenAPI spec', message);
  try {
    writeFileSync(
      join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi-error.log'),
      message,
      'utf-8',
    );
  } catch (writeError) {
    console.error('Unable to write openapi-error.log', writeError);
  }
  process.exitCode = 1;
});
