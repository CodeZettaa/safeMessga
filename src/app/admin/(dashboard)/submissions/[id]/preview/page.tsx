import { notFound } from 'next/navigation';
import { getSubmission } from '@/lib/queries/admin';
import { getMessages, categoryLabel } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ messages, locale }, submission] = await Promise.all([getMessages(), getSubmission(id)]);
  if (!submission) notFound();

  const answer = Array.isArray(submission.answers) ? submission.answers[0] : submission.answers;
  const category = submission.categories as { name_ar?: string; name_en?: string | null } | null;

  return (
    <article className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm text-muted-foreground">{messages.admin.unpublishedPreview}</p>
      <Badge variant="secondary">
        {category ? categoryLabel({ name_ar: category.name_ar ?? '', name_en: category.name_en }, locale) : ''}
      </Badge>
      <h1 className="mt-4 text-3xl font-bold">
        {answer?.public_question_title || submission.original_title || messages.admin.untitled}
      </h1>
      <div className="prose-answer mt-6 rounded-3xl bg-card p-6 ring-1 ring-foreground/10">
        {answer?.public_question_body || submission.original_message}
      </div>
      <section className="mt-6 rounded-3xl bg-primary/5 p-6">
        <h2 className="font-bold">{messages.questions.answeredBy}</h2>
        <div className="prose-answer mt-3">{answer?.answer_body || messages.admin.noAnswerYet}</div>
      </section>
    </article>
  );
}
