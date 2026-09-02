import { createServiceClient } from '@/lib/supabase/admin';
import type { InboxSubmission, SubmissionStatus } from '@/types/database';

export type InboxFilters = {
  status?: SubmissionStatus | 'published' | 'all';
  categoryId?: string;
  identity?: 'anonymous' | 'identified' | 'all';
  publication?: 'allowed' | 'forbidden' | 'all';
  search?: string;
  from?: string;
  to?: string;
};

export async function listInbox(filters: InboxFilters = {}): Promise<InboxSubmission[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  let query = supabase
    .from('submissions')
    .select(
      'id, reference_code, category_id, original_title, original_message, identity_mode, sender_display_name, sender_email, sender_linkedin, allow_public_name, allow_publication, sender_hash, message_fingerprint, status, moderation_decision, moderation_categories, moderation_risk_score, moderation_reason_code, moderation_provider, submitted_at, updated_at, private_contact_expires_at, categories(id, key, name_ar, name_en, color), answers(id, is_published, is_draft, slug, public_display_name)',
    )
    .order('submitted_at', { ascending: false });

  if (filters.status && filters.status !== 'all' && filters.status !== 'published') {
    query = query.eq('status', filters.status);
  }

  if (filters.status === 'published') {
    query = query.eq('answers.is_published', true);
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.identity && filters.identity !== 'all') {
    query = query.eq('identity_mode', filters.identity);
  }

  if (filters.publication === 'allowed') {
    query = query.eq('allow_publication', true);
  }
  if (filters.publication === 'forbidden') {
    query = query.eq('allow_publication', false);
  }

  if (filters.from) {
    query = query.gte('submitted_at', filters.from);
  }
  if (filters.to) {
    query = query.lte('submitted_at', filters.to);
  }

  if (filters.search) {
    query = query.or(
      `original_title.ilike.%${filters.search}%,original_message.ilike.%${filters.search}%,reference_code.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query.limit(200);
  if (error || !data) return [];
  return data as unknown as InboxSubmission[];
}

export async function getSubmission(id: string) {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('submissions')
    .select(
      '*, categories(*), answers(*), admin_notes(*)',
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getAdminOverview() {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      pending: 0,
      needsReview: 0,
      answered: 0,
      published: 0,
      rejected: 0,
      trends: [] as Array<{ day: string; count: number }>,
      categories: [] as Array<{ name_ar: string; name_en: string | null; count: number; color: string }>,
    };
  }

  const [{ count: pending }, { count: needsReview }, { count: answered }, { count: published }, { count: rejected }] =
    await Promise.all([
      supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'needs_review'),
      supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'answered'),
      supabase.from('answers').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('moderation_events').select('*', { count: 'exact', head: true }).eq('decision', 'rejected'),
    ]);

  const since = new Date();
  since.setDate(since.getDate() - 13);
  const { data: recent } = await supabase
    .from('submissions')
    .select('submitted_at')
    .gte('submitted_at', since.toISOString());

  const trendMap = new Map<string, number>();
  for (let i = 0; i < 14; i += 1) {
    const day = new Date();
    day.setDate(day.getDate() - (13 - i));
    trendMap.set(day.toISOString().slice(0, 10), 0);
  }
  for (const row of recent ?? []) {
    const key = String(row.submitted_at).slice(0, 10);
    trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }

  const { data: categoryRows } = await supabase
    .from('submissions')
    .select('category_id, categories(name_ar, name_en, color)');

  const catMap = new Map<string, { name_ar: string; name_en: string | null; count: number; color: string }>();
  for (const row of categoryRows ?? []) {
    const cat = row.categories as { name_ar?: string; name_en?: string | null; color?: string } | null;
    const nameAr = cat?.name_ar ?? 'غير مصنف';
    const color = cat?.color ?? '#5B3A8C';
    const current = catMap.get(nameAr) ?? {
      name_ar: nameAr,
      name_en: cat?.name_en ?? null,
      count: 0,
      color,
    };
    current.count += 1;
    catMap.set(nameAr, current);
  }

  return {
    pending: pending ?? 0,
    needsReview: needsReview ?? 0,
    answered: answered ?? 0,
    published: published ?? 0,
    rejected: rejected ?? 0,
    trends: [...trendMap.entries()].map(([day, count]) => ({ day, count })),
    categories: [...catMap.values()].sort((a, b) => b.count - a.count),
  };
}

export async function getRejectionStats() {
  const supabase = createServiceClient();
  if (!supabase) return { total: 0, byReason: [] as Array<{ reason: string; count: number }> };

  const { data } = await supabase
    .from('moderation_events')
    .select('reason_code')
    .eq('decision', 'rejected');

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.reason_code, (map.get(row.reason_code) ?? 0) + 1);
  }

  return {
    total: data?.length ?? 0,
    byReason: [...map.entries()].map(([reason, count]) => ({ reason, count })),
  };
}

export async function listBlockedTerms() {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('blocked_terms')
    .select('id, normalized_term, language, category, severity, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data ?? [];
}
