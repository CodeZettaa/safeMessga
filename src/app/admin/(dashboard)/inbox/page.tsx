import Link from 'next/link';
import { getMessages, categoryLabel } from '@/lib/i18n';
import { listInbox } from '@/lib/queries/admin';
import { listAllCategories } from '@/lib/queries/categories';
import { StatusBadge } from '@/components/admin/status-badge';
import { formatRelative } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SubmissionStatus } from '@/types/database';

type SearchParams = Promise<{
  status?: string;
  category?: string;
  identity?: string;
  publication?: string;
  q?: string;
  from?: string;
  to?: string;
}>;

export default async function InboxPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [{ messages, locale }, categories, items] = await Promise.all([
    getMessages(),
    listAllCategories(),
    listInbox({
      status: (params.status as SubmissionStatus | 'published' | 'all') || 'all',
      categoryId: params.category,
      identity: (params.identity as 'anonymous' | 'identified' | 'all') || 'all',
      publication: (params.publication as 'allowed' | 'forbidden' | 'all') || 'all',
      search: params.q,
      from: params.from,
      to: params.to,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{messages.admin.inbox}</h1>
      <form className="grid gap-3 rounded-3xl border bg-card p-4 md:grid-cols-3 lg:grid-cols-6">
        <select name="status" defaultValue={params.status ?? 'all'} className="h-9 rounded-lg border bg-background px-2 text-sm">
          <option value="all">{messages.admin.allStatuses}</option>
          <option value="pending">{messages.admin.pending}</option>
          <option value="needs_review">{messages.admin.needsReview}</option>
          <option value="answered">{messages.admin.answered}</option>
          <option value="archived">{messages.admin.archived}</option>
          <option value="published">{messages.admin.published}</option>
        </select>
        <select name="category" defaultValue={params.category ?? ''} className="h-9 rounded-lg border bg-background px-2 text-sm">
          <option value="">{messages.admin.allCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {categoryLabel(category, locale)}
            </option>
          ))}
        </select>
        <select name="identity" defaultValue={params.identity ?? 'all'} className="h-9 rounded-lg border bg-background px-2 text-sm">
          <option value="all">{messages.admin.identity}</option>
          <option value="anonymous">{messages.common.anonymous}</option>
          <option value="identified">{messages.admin.named}</option>
        </select>
        <select
          name="publication"
          defaultValue={params.publication ?? 'all'}
          className="h-9 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="all">{messages.admin.publication}</option>
          <option value="allowed">{messages.admin.allowed}</option>
          <option value="forbidden">{messages.admin.forbidden}</option>
        </select>
        <Input type="date" name="from" defaultValue={params.from} />
        <Input name="q" defaultValue={params.q} placeholder={messages.common.search} />
        <button className={cn(buttonVariants(), 'md:col-span-3 lg:col-span-6')} type="submit">
          {messages.admin.applyFilters}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-3xl border border-dashed p-8 text-muted-foreground">{messages.admin.emptyInbox}</p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const answer = Array.isArray(item.answers) ? item.answers[0] : item.answers;
            return (
              <Link key={item.id} href={`/admin/submissions/${item.id}`}>
                <Card>
                  <CardHeader className="flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base leading-7">
                        {item.original_title || item.original_message.slice(0, 80)}
                      </CardTitle>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {item.reference_code} · {formatRelative(item.submitted_at, locale)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={item.status} />
                      {answer?.is_published ? <StatusBadge value="published" /> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 text-sm">
                    <StatusBadge value={item.identity_mode} />
                    <StatusBadge value={item.moderation_decision} />
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {item.categories ? categoryLabel(item.categories, locale) : messages.admin.uncategorized}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {item.allow_publication ? messages.admin.publishAllowed : messages.admin.publishForbidden}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
