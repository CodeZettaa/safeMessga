import { createServiceClient } from '@/lib/supabase/admin';
import { defaultSiteSettings } from '@/lib/settings/defaults';
import type { SiteSettings } from '@/types/database';

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = createServiceClient();
  if (!supabase) return defaultSiteSettings;

  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (error || !data) return defaultSiteSettings;
  return data as SiteSettings;
}
