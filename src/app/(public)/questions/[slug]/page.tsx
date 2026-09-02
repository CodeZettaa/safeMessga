import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteConfig } from '@/lib/config';
import { formatDate } from '@/lib/format';
import { getPublicEnv } from '@/lib/env';
import { getMessages, categoryLabel, localizedAnonymousName } from '@/lib/i18n';
import {
  getPublishedQuestion,
  incrementViews,
  listRelatedQuestions,
} from '@/lib/queries/public-questions';
import { QuestionCard } from '@/components/public/question-card';
import { ShareButtons } from '@/components/public/share-buttons';
import { Badge } from '@/components/ui/badge';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ messages, locale }, question] = await Promise.all([getMessages(), getPublishedQuestion(slug)]);
  if (!question) {
    return { title: messages.common.notFound, robots: { index: false, follow: false } };
  }

  return {
    title: question.title,
    description: question.questionBody.slice(0, 150),
    openGraph: {
      title: question.title,
      description: question.answerBody.slice(0, 150),
      locale: locale === 'en' ? 'en_US' : 'ar_EG',
      type: 'article',
    },
  };
}

export default async function QuestionPage({ params }: Props) {
  const { slug } = await params;
  const [{ messages, locale }, question] = await Promise.all([getMessages(), getPublishedQuestion(slug)]);
  if (!question) notFound();

  await incrementViews(slug);
  const related = await listRelatedQuestions(slug, question.category.key);
  const url = `${getPublicEnv().siteUrl}/questions/${slug}`;
  const displayName = localizedAnonymousName(question.displayName, messages);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    inLanguage: locale === 'en' ? 'en' : 'ar',
    mainEntity: {
      '@type': 'Question',
      name: question.title,
      text: question.questionBody,
      datePublished: question.publishedAt,
      author: { '@type': 'Person', name: displayName },
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: question.answerBody,
        author: { '@type': 'Person', name: siteConfig.ownerName },
      },
    },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Badge variant="secondary">
        {categoryLabel({ name_ar: question.category.nameAr, name_en: question.category.nameEn }, locale)}
      </Badge>
      <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">{question.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {displayName} · {formatDate(question.publishedAt, locale)} · {question.viewCount} {messages.questions.views}
      </p>
      <div className="prose-answer mt-8 rounded-3xl bg-card p-6 text-lg leading-9 ring-1 ring-foreground/10">
        {question.questionBody}
      </div>
      <section className="mt-8 rounded-3xl bg-primary/5 p-6 ring-1 ring-primary/15">
        <h2 className="text-xl font-bold">{messages.questions.answeredBy}</h2>
        <div className="prose-answer mt-4 leading-9">{question.answerBody}</div>
      </section>
      <div className="mt-8">
        <ShareButtons url={url} title={question.title} />
      </div>
      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold">{messages.questions.related}</h2>
          <div className="grid gap-4">
            {related.map((item) => (
              <QuestionCard key={item.slug} question={item} messages={messages} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
