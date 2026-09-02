import { createBrowserClient } from '@supabase/ssr';
import { getPublicEnv, isSupabaseConfigured } from '@/lib/env';

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const env = getPublicEnv();
  return createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
}
