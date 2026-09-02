import { notFound } from 'next/navigation';
import { getSubmission } from '@/lib/queries/admin';
import { listAllCategories } from '@/lib/queries/categories';
import { getMessages } from '@/lib/i18n';
import { SubmissionEditor } from '@/components/admin/submission-editor';

export default async function SubmissionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ messages }, submission, categories] = await Promise.all([
    getMessages(),
    getSubmission(id),
    listAllCategories(),
  ]);
  if (!submission) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{messages.admin.details}</h1>
      <SubmissionEditor submission={submission} categories={categories} />
    </div>
  );
}
