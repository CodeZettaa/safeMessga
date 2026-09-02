import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getServerEnv, isServerReady } from '@/lib/env';

export function createServiceClient() {
  if (!isServerReady()) {
    return null;
  }

  const env = getServerEnv();
  return createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
