-- Ask Nourhan schema, constraints, indexes, and Row Level Security.
-- Apply with the Supabase SQL editor or: supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.identity_mode as enum ('anonymous', 'identified');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.submission_status as enum (
    'pending',
    'needs_review',
    'answered',
    'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.moderation_decision as enum (
    'accepted',
    'needs_review',
    'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.moderation_mode as enum ('strict', 'balanced');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.blocked_term_language as enum ('ar', 'en', 'arabizi', 'mixed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.blocked_term_category as enum (
    'insult_ar',
    'insult_en',
    'insult_arabizi',
    'sexual_harassment',
    'threat',
    'hate_speech',
    'personal_attack',
    'spam',
    'suspicious_link',
    'contact_solicitation'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin allow-list (populated manually after creating the Auth user)
-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_ar text not null,
  name_en text,
  icon text not null default 'message-circle',
  color text not null default '#5B3A8C',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_key_format check (key ~ '^[a-z0-9_]+$'),
  constraint categories_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$')
);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Submissions (accepted / needs_review only — rejected text is never stored)
-- ---------------------------------------------------------------------------

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  category_id uuid not null references public.categories (id),
  original_title text,
  original_message text not null,
  identity_mode public.identity_mode not null,
  sender_display_name text,
  sender_email text,
  sender_linkedin text,
  allow_public_name boolean not null default false,
  allow_publication boolean not null default true,
  sender_hash text not null,
  message_fingerprint text not null,
  status public.submission_status not null default 'pending',
  moderation_decision public.moderation_decision not null,
  moderation_categories text[] not null default '{}',
  moderation_risk_score numeric(4, 3) not null,
  moderation_reason_code text not null,
  moderation_provider text not null default 'local',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  private_contact_expires_at timestamptz,
  constraint submissions_message_length check (
    char_length(original_message) between 10 and 2000
  ),
  constraint submissions_title_length check (
    original_title is null or char_length(original_title) <= 160
  ),
  constraint submissions_anonymous_has_no_identity check (
    identity_mode <> 'anonymous'
    or (
      sender_display_name is null
      and sender_email is null
      and sender_linkedin is null
      and allow_public_name = false
    )
  ),
  constraint submissions_identified_has_name check (
    identity_mode <> 'identified'
    or sender_display_name is not null
  ),
  constraint submissions_risk_range check (
    moderation_risk_score >= 0 and moderation_risk_score <= 1
  ),
  constraint submissions_no_rejected_content check (
    moderation_decision <> 'rejected'
  )
);

create index if not exists submissions_status_submitted_idx
  on public.submissions (status, submitted_at desc);
create index if not exists submissions_category_idx
  on public.submissions (category_id);
create index if not exists submissions_sender_hash_idx
  on public.submissions (sender_hash);
create index if not exists submissions_fingerprint_idx
  on public.submissions (message_fingerprint, submitted_at desc);
create index if not exists submissions_search_idx
  on public.submissions using gin (
    to_tsvector('simple', coalesce(original_title, '') || ' ' || original_message)
  );

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Answers / public Q&A
-- ---------------------------------------------------------------------------

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  answer_body text not null default '',
  public_question_title text,
  public_question_body text,
  public_display_name text not null default 'مجهول',
  slug text unique,
  is_published boolean not null default false,
  is_pinned boolean not null default false,
  is_draft boolean not null default true,
  view_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint answers_view_count_nonnegative check (view_count >= 0),
  constraint answers_published_requires_content check (
    is_published = false
    or (
      slug is not null
      and public_question_title is not null
      and char_length(public_question_title) > 0
      and public_question_body is not null
      and char_length(public_question_body) > 0
      and answer_body is not null
      and char_length(answer_body) > 0
    )
  )
);

create index if not exists answers_published_idx
  on public.answers (is_published, published_at desc)
  where is_published = true;
create index if not exists answers_pinned_idx
  on public.answers (is_pinned)
  where is_published = true and is_pinned = true;

drop trigger if exists answers_set_updated_at on public.answers;
create trigger answers_set_updated_at
before update on public.answers
for each row execute function public.set_updated_at();

create or replace function public.enforce_publish_rules()
returns trigger
language plpgsql
as $$
declare
  sub public.submissions%rowtype;
begin
  select * into sub from public.submissions where id = new.submission_id;

  if sub is null then
    raise exception 'submission_missing';
  end if;

  if new.is_published then
    if not sub.allow_publication then
      raise exception 'publication_forbidden';
    end if;

    if not sub.allow_public_name then
      new.public_display_name := 'مجهول';
    end if;

    if sub.sender_email is not null
       and (
         coalesce(new.public_question_title, '') ilike '%' || sub.sender_email || '%'
         or coalesce(new.public_question_body, '') ilike '%' || sub.sender_email || '%'
         or coalesce(new.answer_body, '') ilike '%' || sub.sender_email || '%'
         or coalesce(new.public_display_name, '') ilike '%' || sub.sender_email || '%'
       )
    then
      raise exception 'private_contact_in_public_content';
    end if;

    if sub.sender_linkedin is not null
       and (
         coalesce(new.public_question_title, '') ilike '%' || sub.sender_linkedin || '%'
         or coalesce(new.public_question_body, '') ilike '%' || sub.sender_linkedin || '%'
         or coalesce(new.answer_body, '') ilike '%' || sub.sender_linkedin || '%'
       )
    then
      raise exception 'private_contact_in_public_content';
    end if;

    if new.published_at is null then
      new.published_at := now();
    end if;

    new.is_draft := false;
  end if;

  return new;
end;
$$;

drop trigger if exists answers_enforce_publish_rules on public.answers;
create trigger answers_enforce_publish_rules
before insert or update on public.answers
for each row execute function public.enforce_publish_rules();

-- ---------------------------------------------------------------------------
-- Admin notes
-- ---------------------------------------------------------------------------

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  constraint admin_notes_not_empty check (char_length(trim(note)) > 0)
);

create index if not exists admin_notes_submission_idx
  on public.admin_notes (submission_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Blocked terms (admin-editable; never sent to the browser as a full dump
-- from public endpoints)
-- ---------------------------------------------------------------------------

create table if not exists public.blocked_terms (
  id uuid primary key default gen_random_uuid(),
  normalized_term text not null,
  language public.blocked_term_language not null default 'mixed',
  category public.blocked_term_category not null,
  severity smallint not null default 3,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint blocked_terms_severity_range check (severity between 1 and 5),
  constraint blocked_terms_term_not_empty check (char_length(trim(normalized_term)) >= 2)
);

create unique index if not exists blocked_terms_unique_active
  on public.blocked_terms (normalized_term)
  where is_active = true;

-- ---------------------------------------------------------------------------
-- Moderation events: rejected attempts store metadata only, never the text
-- ---------------------------------------------------------------------------

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  sender_hash text not null,
  occurred_at timestamptz not null default now(),
  decision public.moderation_decision not null,
  reason_code text not null,
  risk_score numeric(4, 3) not null,
  categories text[] not null default '{}',
  provider text not null default 'local'
);

create index if not exists moderation_events_sender_idx
  on public.moderation_events (sender_hash, occurred_at desc);
create index if not exists moderation_events_occurred_idx
  on public.moderation_events (occurred_at desc);

-- ---------------------------------------------------------------------------
-- Anti-abuse bookkeeping
-- ---------------------------------------------------------------------------

create table if not exists public.sender_blocks (
  sender_hash text primary key,
  blocked_until timestamptz not null,
  rejection_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limit_windows (
  sender_hash text not null,
  window_start timestamptz not null,
  submission_count integer not null default 0,
  primary key (sender_hash, window_start)
);

-- ---------------------------------------------------------------------------
-- Site settings (singleton)
-- ---------------------------------------------------------------------------

create table if not exists public.site_settings (
  id smallint primary key default 1,
  moderation_mode public.moderation_mode not null default 'balanced',
  rate_limit_window_seconds integer not null default 600,
  rate_limit_max_submissions integer not null default 3,
  cooldown_seconds integer not null default 30,
  risk_threshold_reject numeric(4, 3) not null default 0.800,
  risk_threshold_review numeric(4, 3) not null default 0.450,
  retention_days_private_contact integer not null default 180,
  blocked_attempts_threshold integer not null default 3,
  temp_block_minutes integer not null default 60,
  captcha_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1),
  constraint site_settings_thresholds check (
    risk_threshold_review >= 0
    and risk_threshold_review <= risk_threshold_reject
    and risk_threshold_reject <= 1
  )
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Public-safe view. Only published answers, never private fields.
-- security_invoker = false so the view can read answers/submissions as owner
-- while exposing only the safe columns below.
-- ---------------------------------------------------------------------------

create or replace view public.published_questions
with (security_invoker = false)
as
select
  a.id,
  a.slug,
  a.public_question_title as title,
  a.public_question_body as question_body,
  a.answer_body,
  a.public_display_name as display_name,
  a.is_pinned,
  a.view_count,
  a.published_at,
  c.id as category_id,
  c.key as category_key,
  c.name_ar as category_name_ar,
  c.icon as category_icon,
  c.color as category_color
from public.answers a
join public.submissions s on s.id = a.submission_id
join public.categories c on c.id = s.category_id
where a.is_published = true
  and a.slug is not null;

create or replace function public.increment_published_views(target_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.answers
  set view_count = view_count + 1
  where slug = target_slug
    and is_published = true;
end;
$$;

revoke all on function public.increment_published_views(text) from public;
grant execute on function public.increment_published_views(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.submissions enable row level security;
alter table public.answers enable row level security;
alter table public.admin_notes enable row level security;
alter table public.blocked_terms enable row level security;
alter table public.moderation_events enable row level security;
alter table public.sender_blocks enable row level security;
alter table public.rate_limit_windows enable row level security;
alter table public.site_settings enable row level security;

-- Anonymous visitors must not insert into the database directly.
revoke insert, update, delete on all tables in schema public from anon;
revoke all on public.submissions from anon;
revoke all on public.admin_notes from anon;
revoke all on public.blocked_terms from anon;
revoke all on public.moderation_events from anon;
revoke all on public.sender_blocks from anon;
revoke all on public.rate_limit_windows from anon;
revoke all on public.site_settings from anon;
revoke all on public.admin_users from anon, authenticated;

grant select on public.published_questions to anon, authenticated;
grant select on public.categories to anon, authenticated;

-- Categories: public may read active rows; admins manage all.
drop policy if exists "public read active categories" on public.categories;
create policy "public read active categories"
  on public.categories
  for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories"
  on public.categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Answers: public may only see published rows, and only via the view or
-- this policy (the table still contains no emails / LinkedIn / hashes).
drop policy if exists "public read published answers" on public.answers;
create policy "public read published answers"
  on public.answers
  for select
  to anon, authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "admins manage answers" on public.answers;
create policy "admins manage answers"
  on public.answers
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Submissions: never public.
drop policy if exists "admins manage submissions" on public.submissions;
create policy "admins manage submissions"
  on public.submissions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage notes" on public.admin_notes;
create policy "admins manage notes"
  on public.admin_notes
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage blocked terms" on public.blocked_terms;
create policy "admins manage blocked terms"
  on public.blocked_terms
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins read moderation events" on public.moderation_events;
create policy "admins read moderation events"
  on public.moderation_events
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins read sender blocks" on public.sender_blocks;
create policy "admins read sender blocks"
  on public.sender_blocks
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins manage settings" on public.site_settings;
create policy "admins manage settings"
  on public.site_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admin users table: no client writes. Service role / SQL editor only.
drop policy if exists "admins can see themselves" on public.admin_users;
create policy "admins can see themselves"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());
