import { createServiceClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Category } from '@/types/database';

export async function listActiveCategories(): Promise<Category[]> {
  const supabase = createServiceClient() ?? (await createServerSupabaseClient());
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('id, key, name_ar, name_en, icon, color, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to load categories', error.message);
    return [];
  }

  return (data ?? []) as Category[];
}

export async function getDefaultCategoryId(): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data: general } = await supabase
    .from('categories')
    .select('id')
    .eq('key', 'general')
    .eq('is_active', true)
    .maybeSingle();
  if (general?.id) return general.id;

  const { data: first } = await supabase
    .from('categories')
    .select('id')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return first?.id ?? null;
}

export async function listAllCategories(): Promise<Category[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('id, key, name_ar, name_en, icon, color, sort_order, is_active')
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data as Category[];
}
