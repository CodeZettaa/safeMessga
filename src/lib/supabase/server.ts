import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicEnv, isSupabaseConfigured } from '@/lib/env';

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component; proxy.ts refreshes the session.
        }
      },
    },
  });
}
