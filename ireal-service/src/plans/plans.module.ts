import { Module } from '@nestjs/common';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SupabaseModule, AiModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
