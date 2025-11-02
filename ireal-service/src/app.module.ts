import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';
import { IdeasModule } from './ideas/ideas.module';
import { MetricsModule } from './metrics/metrics.module';
import { PiecesModule } from './pieces/pieces.module';
import { PlansModule } from './plans/plans.module';
import { validateEnv } from './common/config/env.validation';
import { ObservabilityModule } from './common/observability/observability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    ObservabilityModule,
    AuthModule,
    IdeasModule,
    PlansModule,
    AiModule,
    PiecesModule,
    HealthModule,
    MetricsModule,
  ],
})
export class AppModule {}
