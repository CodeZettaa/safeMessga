import { z } from 'zod';

const optionalString = z.string().optional().transform((value) => value?.trim() || undefined);

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SENDER_HASH_SALT: z.string().min(8).optional(),
  ADMIN_EMAIL: z.email().optional().or(z.literal('').transform(() => undefined)),
  MODERATION_PROVIDER: z.enum(['local', 'openai']).optional(),
  OPENAI_API_KEY: optionalString,
  OPENAI_MODERATION_MODEL: optionalString,
  TURNSTILE_SECRET_KEY: optionalString,
});

export function getPublicEnv() {
  const parsed = publicSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });

  return {
    siteUrl: parsed.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    supabaseUrl: parsed.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    turnstileSiteKey: parsed.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  };
}

export function isSupabaseConfigured() {
  const env = getPublicEnv();
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function getServerEnv() {
  const parsed = serverSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SENDER_HASH_SALT: process.env.SENDER_HASH_SALT,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    MODERATION_PROVIDER: process.env.MODERATION_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODERATION_MODEL: process.env.OPENAI_MODERATION_MODEL,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  });

  return {
    siteUrl: parsed.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    supabaseUrl: parsed.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
    senderHashSalt: parsed.SENDER_HASH_SALT,
    adminEmail: parsed.ADMIN_EMAIL,
    moderationProvider: parsed.MODERATION_PROVIDER ?? 'local',
    openaiApiKey: parsed.OPENAI_API_KEY,
    openaiModerationModel: parsed.OPENAI_MODERATION_MODEL ?? 'omni-moderation-latest',
    turnstileSiteKey: parsed.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    turnstileSecretKey: parsed.TURNSTILE_SECRET_KEY,
  };
}

export function isServerReady() {
  const env = getServerEnv();
  return Boolean(
    env.supabaseUrl &&
      env.supabaseAnonKey &&
      env.supabaseServiceRoleKey &&
      env.senderHashSalt,
  );
}
