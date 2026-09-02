import { createServiceClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toPublicQuestionDto } from '@/lib/validation/publishing';
import type { PublishedQuestion } from '@/types/database';

const PUBLIC_COLUMNS =
  'id, slug, title, question_body, answer_body, display_name, is_pinned, view_count, published_at, category_id, category_key, category_name_ar, category_icon, category_color';

async function publicClient() {
  return (await createServerSupabaseClient()) ?? createServiceClient();
}

async function withCategoryEnglishNames(rows: PublishedQuestion[]) {
  const supabase = await publicClient();
  if (!supabase || rows.length === 0) return rows;

  const { data } = await supabase.from('categories').select('key, name_en');
  const names = new Map((data ?? []).map((row) => [row.key as string, (row.name_en as string | null) ?? null]));
  return rows.map((row) => ({
    ...row,
    category_name_en: names.get(row.category_key) ?? null,
  }));
}

export async function listPublishedQuestions(input?: {
  search?: string;
  categoryKey?: string;
  sort?: 'latest' | 'views';
  page?: number;
  pageSize?: number;
}) {
  const supabase = await publicClient();
  if (!supabase) {
    return { items: [], total: 0, page: 1, pageSize: input?.pageSize ?? 12 };
  }

  const page = Math.max(1, input?.page ?? 1);
  const pageSize = input?.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('published_questions').select(PUBLIC_COLUMNS, { count: 'exact' });

  if (input?.categoryKey) {
    query = query.eq('category_key', input.categoryKey);
  }

  if (input?.search) {
    query = query.or(
      `title.ilike.%${input.search}%,question_body.ilike.%${input.search}%,answer_body.ilike.%${input.search}%`,
    );
  }

  query =
    input?.sort === 'views'
      ? query.order('view_count', { ascending: false })
      : query.order('is_pinned', { ascending: false }).order('published_at', { ascending: false });

  const { data, count, error } = await query.range(from, to);
  if (error || !data) {
    return { items: [], total: 0, page, pageSize };
  }

  const items = (await withCategoryEnglishNames(data as PublishedQuestion[])).map((row) =>
    toPublicQuestionDto(row),
  );
  return { items, total: count ?? items.length, page, pageSize };
}

export async function getPublishedQuestion(slug: string) {
  const supabase = await publicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('published_questions')
    .select(PUBLIC_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  const [question] = await withCategoryEnglishNames([data as PublishedQuestion]);
  return question ? toPublicQuestionDto(question) : null;
}

export async function listRelatedQuestions(slug: string, categoryKey: string) {
  const supabase = await publicClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('published_questions')
    .select(PUBLIC_COLUMNS)
    .eq('category_key', categoryKey)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(3);

  return (await withCategoryEnglishNames((data ?? []) as PublishedQuestion[])).map((row) =>
    toPublicQuestionDto(row),
  );
}

export async function listSitemapQuestions() {
  const supabase = await publicClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('published_questions')
    .select('slug, published_at')
    .order('published_at', { ascending: false });

  return (data ?? []) as Array<{ slug: string; published_at: string }>;
}

export async function incrementViews(slug: string) {
  const supabase = createServiceClient() ?? (await createServerSupabaseClient());
  if (!supabase) return;
  await supabase.rpc('increment_published_views', { target_slug: slug });
}
