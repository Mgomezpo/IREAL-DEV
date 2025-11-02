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
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce
    .number()
    .min(1, 'RATE_LIMIT_WINDOW_SECONDS must be at least 1')
    .default(60),
  AI_RATE_LIMIT_PER_USER: z.coerce
    .number()
    .min(1, 'AI_RATE_LIMIT_PER_USER must be at least 1')
    .default(5),
  AI_RATE_LIMIT_PER_IP: z.coerce
    .number()
    .min(1, 'AI_RATE_LIMIT_PER_IP must be at least 1')
    .default(30),
  WRITE_RATE_LIMIT_PER_USER: z.coerce
    .number()
    .min(1, 'WRITE_RATE_LIMIT_PER_USER must be at least 1')
    .default(60),
  WRITE_RATE_LIMIT_PER_IP: z.coerce
    .number()
    .min(1, 'WRITE_RATE_LIMIT_PER_IP must be at least 1')
    .default(120),
  ERROR_LOG_SAMPLE_RATE: z.coerce
    .number()
    .min(0, 'ERROR_LOG_SAMPLE_RATE must be >= 0')
    .max(1, 'ERROR_LOG_SAMPLE_RATE must be <= 1')
    .default(0.1),
  SUPABASE_SERVICE_URL: z
    .string()
    .url('SUPABASE_SERVICE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
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
