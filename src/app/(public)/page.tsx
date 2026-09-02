import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { siteConfig } from '@/lib/config';
import { getMessages } from '@/lib/i18n';
import { listActiveCategories } from '@/lib/queries/categories';
import { listPublishedQuestions } from '@/lib/queries/public-questions';
import { AskForm } from '@/components/ask/ask-form';
import { QuestionCard } from '@/components/public/question-card';

export default async function HomePage() {
  const [{ messages, locale }, categories, latest] = await Promise.all([
    getMessages(),
    listActiveCategories(),
    listPublishedQuestions({ pageSize: 4, sort: 'latest' }),
  ]);

  return (
    <div>
      <section className="mx-auto max-w-xl px-4 py-12 md:py-20">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
          <Sparkles className="size-4" />
          {locale === 'en' ? siteConfig.ownerName : siteConfig.ownerNameAr}
        </p>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">{messages.home.heroTitle}</h1>
        <p className="mt-4 leading-8 text-muted-foreground">{messages.home.heroBody}</p>
        <div id="ask" className="mt-8 scroll-mt-24">
          <AskForm categories={categories} />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/questions" className="text-primary underline-offset-4 hover:underline">
            {messages.home.secondaryCta}
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20">
        <h2 className="mb-6 text-xl font-bold">{messages.home.latestTitle}</h2>
        {latest.items.length === 0 ? (
          <p className="rounded-3xl border border-dashed p-8 text-muted-foreground">{messages.home.emptyLatest}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {latest.items.map((question) => (
              <QuestionCard key={question.slug} question={question} messages={messages} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
