import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import YAML from 'yaml';
import { AppModule } from '../app.module';
import { getAppVersion } from '../common/version.util';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('IREAL Service API')
    .setDescription('Versioned API for the decoupled IREAL backend service.')
    .setVersion(getAppVersion())
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const yaml = YAML.stringify(document);
  const outputDir = join(__dirname, '..', '..', '..', 'docs', 'api');

  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, 'openapi.yaml');
  writeFileSync(outputPath, yaml, 'utf-8');

  await app.close();
}

generate().catch((error) => {
  console.error('Failed to generate OpenAPI spec', error);
  process.exitCode = 1;
});
