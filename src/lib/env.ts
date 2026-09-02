import { z } from 'zod';

function blankToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function asUrl(value: string | undefined) {
  const raw = blankToUndefined(value);
  if (!raw) return undefined;
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).origin;
  } catch {
    return undefined;
  }
}

export function resolveSiteUrl() {
  return (
    asUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    asUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    asUrl(process.env.VERCEL_URL) ??
    'http://localhost:3000'
  );
}

const optionalString = z.string().optional().transform((value) => blankToUndefined(value));

function supabaseUrlFromEnv() {
  return asUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? asUrl(process.env.SUPABASE_URL);
}

export function getPublicEnv() {
  return {
    siteUrl: resolveSiteUrl(),
    supabaseUrl: supabaseUrlFromEnv(),
    supabaseAnonKey: blankToUndefined(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    turnstileSiteKey: optionalString.parse(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
  };
}

export function isSupabaseConfigured() {
  const env = getPublicEnv();
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function getServerEnv() {
  const publicEnv = getPublicEnv();
  const adminEmail = blankToUndefined(process.env.ADMIN_EMAIL);
  const salt = blankToUndefined(process.env.SENDER_HASH_SALT);

  return {
    siteUrl: publicEnv.siteUrl,
    supabaseUrl: publicEnv.supabaseUrl,
    supabaseAnonKey: publicEnv.supabaseAnonKey,
    supabaseServiceRoleKey: blankToUndefined(process.env.SUPABASE_SERVICE_ROLE_KEY),
    senderHashSalt: salt && salt.length >= 8 ? salt : undefined,
    adminEmail: adminEmail && z.email().safeParse(adminEmail).success ? adminEmail : undefined,
    moderationProvider: process.env.MODERATION_PROVIDER === 'openai' ? 'openai' : 'local',
    openaiApiKey: optionalString.parse(process.env.OPENAI_API_KEY),
    openaiModerationModel: optionalString.parse(process.env.OPENAI_MODERATION_MODEL) ?? 'omni-moderation-latest',
    turnstileSiteKey: publicEnv.turnstileSiteKey,
    turnstileSecretKey: optionalString.parse(process.env.TURNSTILE_SECRET_KEY),
  };
}

export function isServerReady() {
  const env = getServerEnv();
  return Boolean(
    env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey && env.senderHashSalt,
  );
}
