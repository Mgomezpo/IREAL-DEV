import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/supabase/supabase.service';
import { randomUUID } from 'crypto';

async function seed() {
  const configService = new ConfigService();
  const supabase = new SupabaseService(configService);
  const client = supabase.getClient();

  const demoUserId =
    configService.get<string>('SEED_USER_ID') ?? `seed-${randomUUID()}`;

  const { error } = await client.from('ideas').insert(
    Array.from({ length: 5 }).map((_, index) => ({
      user_id: demoUserId,
      title: `Idea ${index + 1}`,
      content: `Contenido de idea ${index + 1}`,
    })),
  );

  if (error) {
    console.error('Failed to seed ideas:', error.message);
    process.exitCode = 1;
    return;
  }

  console.log(`Seeded ideas for user ${demoUserId}`);
}

seed().catch((error) => {
  console.error('Seed script crashed', error);
  process.exitCode = 1;
});
