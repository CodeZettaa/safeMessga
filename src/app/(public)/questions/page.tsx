import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages, categoryLabel } from '@/lib/i18n';
import { listActiveCategories } from '@/lib/queries/categories';
import { listPublishedQuestions } from '@/lib/queries/public-questions';
import { QuestionCard } from '@/components/public/question-card';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();
  return { title: messages.meta.questionsTitle };
}

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
}>;

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? '1') || 1;
  const sort = params.sort === 'views' ? 'views' : 'latest';
  const [{ messages, locale }, categories, result] = await Promise.all([
    getMessages(),
    listActiveCategories(),
    listPublishedQuestions({
      search: params.q,
      categoryKey: params.category,
      sort,
      page,
      pageSize: 12,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  function href(next: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    const merged = {
      q: params.q,
      category: params.category,
      sort,
      page: String(page),
      ...next,
    };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    const query = search.toString();
    return query ? `/questions?${query}` : '/questions';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{messages.questions.title}</h1>
      <p className="mt-3 max-w-2xl leading-8 text-muted-foreground">{messages.questions.body}</p>

      <form className="mt-8 grid gap-3 md:grid-cols-[1fr_auto]" action="/questions">
        <Input name="q" defaultValue={params.q} placeholder={messages.questions.search} />
        <button className={cn(buttonVariants())} type="submit">
          {messages.questions.searchAction}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={href({ category: undefined, page: '1' })}
          className={cn(
            buttonVariants({ variant: params.category ? 'outline' : 'default', size: 'sm' }),
          )}
        >
          {messages.questions.allCategories}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={href({ category: category.key, page: '1' })}
            className={cn(
              buttonVariants({
                variant: params.category === category.key ? 'default' : 'outline',
                size: 'sm',
              }),
            )}
          >
            {categoryLabel(category, locale)}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={href({ sort: 'latest', page: '1' })}
          className={cn(buttonVariants({ variant: sort === 'latest' ? 'secondary' : 'ghost', size: 'sm' }))}
        >
          {messages.questions.latest}
        </Link>
        <Link
          href={href({ sort: 'views', page: '1' })}
          className={cn(buttonVariants({ variant: sort === 'views' ? 'secondary' : 'ghost', size: 'sm' }))}
        >
          {messages.questions.mostViewed}
        </Link>
      </div>

      {result.items.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed p-10 text-muted-foreground">
          {messages.questions.empty}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {result.items.map((question) => (
            <QuestionCard key={question.slug} question={question} messages={messages} locale={locale} />
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-center gap-3">
        {page > 1 ? (
          <Link href={href({ page: String(page - 1) })} className={cn(buttonVariants({ variant: 'outline' }))}>
            {messages.questions.previous}
          </Link>
        ) : null}
        <span className="text-sm text-muted-foreground">
          {messages.questions.page} {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={href({ page: String(page + 1) })} className={cn(buttonVariants({ variant: 'outline' }))}>
            {messages.questions.next}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
