'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function signInAdmin(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/admin');

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirect('/admin/login?error=unavailable');
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect('/admin/login?error=invalid');
  }

  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function signOutAdmin() {
  const supabase = await createServerSupabaseClient();
  await supabase?.auth.signOut();
  redirect('/admin/login');
}
