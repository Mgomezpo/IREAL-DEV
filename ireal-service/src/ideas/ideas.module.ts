import { Module } from '@nestjs/common';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { IdeasService } from './ideas.service';
import { IdeasController } from './ideas.controller';

@Module({
  imports: [SupabaseModule],
  providers: [IdeasService],
  controllers: [IdeasController],
})
export class IdeasModule {}
