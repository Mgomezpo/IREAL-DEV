import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().min(0).max(65535).default(3333),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL',
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  AI_PROVIDER: z.string().min(1, 'AI_PROVIDER is required'),
  AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>): Env => {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    const errorMessage = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
      .join('; ');

    throw new Error(`Environment validation error(s): ${errorMessage}`);
  }

  return parsed.data;
};
