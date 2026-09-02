import { createServiceClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerEnv } from '@/lib/env';

export async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdminUser(userId: string, email?: string | null) {
  const env = getServerEnv();
  if (env.adminEmail && email && email.toLowerCase() !== env.adminEmail.toLowerCase()) {
    return false;
  }

  const supabase = createServiceClient() ?? (await createServerSupabaseClient());
  if (!supabase) return false;

  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  return Boolean(data);
}

export async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false as const, status: 401 as const, user: null };
  }

  const allowed = await isAdminUser(user.id, user.email);
  if (!allowed) {
    return { ok: false as const, status: 403 as const, user: null };
  }

  return { ok: true as const, status: 200 as const, user };
}
