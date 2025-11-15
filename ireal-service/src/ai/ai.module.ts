import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '../metrics/metrics.module';
import { RateLimitModule } from '../common/rate-limit/rate-limit.module';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [ConfigModule, MetricsModule, RateLimitModule, SupabaseModule],
  controllers: [AiController],
  providers: [AiService, RateLimitGuard],
  exports: [AiService],
})
export class AiModule {}
