# Ask Nourhan

مساحة آمنة لإرسال الأسئلة والرسائل لنورهان سعيد، مع مراجعة يدوية قبل أي نشر عام.

The public interface defaults to English (LTR). Visitors can switch to Arabic (RTL) from the language control.

## Stack

- Next.js App Router, TypeScript (strict), Tailwind CSS, shadcn/ui
- Supabase Postgres + Auth
- Zod, React Hook Form, Server Actions
- Vitest + Playwright

## Required environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role. Never expose this in the browser. |
| `SENDER_HASH_SALT` | Salt for the privacy-preserving sender hash. Raw IPs are never stored. |
| `ADMIN_EMAIL` | Optional extra check on top of `admin_users` |

Optional:

| Variable | Role |
| --- | --- |
| `MODERATION_PROVIDER=openai` | Enable the external moderation adapter |
| `OPENAI_API_KEY` | Only needed if the provider is enabled |
| `OPENAI_MODERATION_MODEL` | Defaults to `omni-moderation-latest` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Future CAPTCHA |

The app boots without those optional keys. Local rule-based moderation is always on.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase credentials the public pages still render (empty Q&A and category states). Submissions return a setup error until the server env is complete.

```bash
npm run lint
npm run typecheck
npm test
npx playwright install
npm run test:e2e
npm run build
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL, anon key, and service role key into `.env.local`.
3. In the SQL editor, run in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/seed.sql`
4. Confirm Authentication → Providers → Email is enabled. Do not turn on public sign-ups if you can avoid it. This MVP has no public registration page.

### Create the first admin safely

There is no public admin registration flow.

1. In Supabase, open Authentication → Users → Add user.
2. Create the admin with email/password (use the same email as `ADMIN_EMAIL` if you set it).
3. Copy the user UUID, then run:

```sql
insert into public.admin_users (user_id)
select id from auth.users
where email = 'you@example.com';
```

4. Sign in at `/admin/login`.

Row Level Security denies anonymous inserts. Submissions only go through the server action, which uses the service role after validation and moderation.

## How moderation works

Automated moderation is risk reduction, not a perfect guarantee.

1. Input is normalized (Arabic variants, tashkeel, tatweel, repeated letters, separators, Arabizi).
2. A local rule layer scores insults, harassment, threats, spam, links, and contact solicitation.
3. An optional external provider can run if `MODERATION_PROVIDER` is set. If it is missing, the local layer is enough.
4. Balanced mode sends uncertain messages to `needs_review`. Strict mode rejects them.
5. Clearly rejected messages are not stored. Only hashed sender metadata, a reason code, and a risk score are kept.

Rejected senders see:

> الرسالة لا تتوافق مع قواعد المساحة. من فضلك أعد صياغتها بطريقة محترمة.

The exact blocked term is never shown.

## Deploy on Vercel + Supabase

1. Push this repository to GitHub.
2. Import the repo in Vercel.
3. Add the same environment variables as `.env.example`.
4. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
5. Apply the SQL migration and seed in the production Supabase project.
6. Create the admin user in that project’s Auth dashboard and insert the `admin_users` row.

## Project structure

```
src/app/(public)     Public pages (English default, Arabic available)
src/app/admin        Private dashboard
src/app/actions      Server actions
src/lib/moderation   Normalization + local/external providers
src/lib/anti-abuse   Hashing, rate limits, CAPTCHA adapter
src/lib/validation   Zod schemas and publishing rules
supabase/            SQL migration and demo seed
tests/unit           Vitest
tests/e2e            Playwright
```

Owner, brand, and platform names live in `src/lib/config.ts`. Do not hard-code them in components.
