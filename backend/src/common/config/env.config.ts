import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().default('dev-jwt-secret-must-be-at-least-32-chars!!'),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().default('dummy-google-client-id'),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MP_ACCESS_TOKEN: z.string().default('dummy-mp-token'),
  MP_WEBHOOK_SECRET: z.string().default('dummy-mp-secret'),
  MP_PUBLIC_KEY: z.string().default('dummy-mp-key'),
  R2_ACCOUNT_ID: z.string().default('dummy-r2'),
  R2_ACCESS_KEY_ID: z.string().default('dummy-r2-key'),
  R2_SECRET_ACCESS_KEY: z.string().default('dummy-r2-secret'),
  R2_BUCKET_NAME: z.string().default('dummy-bucket'),
  R2_PUBLIC_URL: z.string().default('https://placeholder.r2.dev'),
  BACKEND_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return parsed.data;
}
