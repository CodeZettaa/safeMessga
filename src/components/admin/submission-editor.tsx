'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { categoryLabel } from '@/lib/i18n/locale';
import { fallbackPublicTitle } from '@/lib/validation/publishing';
import {
  addAdminNote,
  allowPublication,
  anonymizeSender,
  archiveSubmission,
  deleteSubmission,
  publishSubmission,
  saveAnswerDraft,
  togglePin,
  unpublishSubmission,
  updateSubmissionCategory,
} from '@/app/actions/admin';
import { useI18n } from '@/components/i18n-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/admin/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/database';

type SubmissionDetail = {
  id: string;
  reference_code: string;
  original_title: string | null;
  original_message: string;
  identity_mode: 'anonymous' | 'identified';
  sender_display_name: string | null;
  sender_email: string | null;
  sender_linkedin: string | null;
  allow_public_name: boolean;
  allow_publication: boolean;
  status: string;
  moderation_decision: string;
  moderation_reason_code: string;
  moderation_risk_score: number;
  category_id: string;
  answers?:
    | {
        answer_body: string;
        public_question_title: string | null;
        public_question_body: string | null;
        slug: string | null;
        is_published: boolean;
        is_pinned: boolean;
      }
    | Array<{
        answer_body: string;
        public_question_title: string | null;
        public_question_body: string | null;
        slug: string | null;
        is_published: boolean;
        is_pinned: boolean;
      }>
    | null;
  admin_notes?: Array<{ id: string; note: string }>;
};

export function SubmissionEditor({
  submission,
  categories,
}: {
  submission: SubmissionDetail;
  categories: Category[];
}) {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const copy = messages.admin;
  const answer = Array.isArray(submission.answers) ? submission.answers[0] : submission.answers;
  const [answerBody, setAnswerBody] = useState(answer?.answer_body || '');
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPublishOverride, setConfirmPublishOverride] = useState(false);
  const [publicationAllowed, setPublicationAllowed] = useState(submission.allow_publication);
  const canPublish = publicationAllowed;
  const forceAnonymous = !submission.allow_public_name || submission.identity_mode === 'anonymous';
  const hasAnswer = Boolean(answerBody.trim());
  const senderLabel = submission.sender_display_name || messages.common.anonymous;

  function errorMessage(error: unknown) {
    if (!(error instanceof Error)) return copy.actionError;
    const mapped: Record<string, string> = {
      publication_forbidden: copy.senderBlockedPublish,
      publish_title_required: copy.publishTitleRequired,
      publish_body_required: copy.publishBodyRequired,
      publish_answer_required: copy.publishAnswerRequired,
      publish_content_required: copy.publishContentRequired,
    };
    return mapped[error.message] ?? error.message;
  }

  function contentPayload(displayChoice: 'anonymous' | 'named') {
    return {
      submissionId: submission.id,
      answerBody,
      publicQuestionTitle:
        answer?.public_question_title ||
        submission.original_title ||
        fallbackPublicTitle(submission.original_message),
      publicQuestionBody: answer?.public_question_body || submission.original_message,
      displayChoice,
    };
  }

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={submission.status} />
        <StatusBadge value={submission.identity_mode} />
        <span className="text-sm text-muted-foreground">{senderLabel}</span>
        <span className="text-sm text-muted-foreground">{submission.reference_code}</span>
      </div>

      <section className="rounded-3xl border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">{copy.originalMessage}</h2>
          <select
            className="h-9 rounded-lg border bg-background px-2 text-sm"
            defaultValue={submission.category_id}
            aria-label={copy.category}
            onChange={(event) =>
              run(() => updateSubmissionCategory(submission.id, event.target.value), copy.categoryUpdated)
            }
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {categoryLabel(category, locale)}
              </option>
            ))}
          </select>
        </div>
        <p className="whitespace-pre-wrap leading-8">{submission.original_message}</p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-5">
        <Label htmlFor="answer">{copy.answer}</Label>
        <Textarea
          id="answer"
          rows={8}
          value={answerBody}
          onChange={(event) => setAnswerBody(event.target.value)}
        />
        {!canPublish ? (
          <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{copy.senderBlockedPublish}</p>
            <Button type="button" variant="outline" onClick={() => setConfirmPublishOverride(true)}>
              {copy.allowPublishAnyway}
            </Button>
          </div>
        ) : null}
        {canPublish && !hasAnswer ? <p className="text-sm text-muted-foreground">{copy.publishAnswerRequired}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!canPublish || !hasAnswer}
            onClick={() =>
              run(
                () =>
                  publishSubmission({
                    ...contentPayload(forceAnonymous ? 'anonymous' : 'named'),
                    pin: Boolean(answer?.is_pinned),
                  }),
                copy.published,
              )
            }
          >
            {copy.publish}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              run(
                () =>
                  saveAnswerDraft(contentPayload(forceAnonymous ? 'anonymous' : 'named')),
                copy.draftSaved,
              )
            }
          >
            {copy.saveDraft}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => run(() => togglePin(submission.id, !answer?.is_pinned), copy.pinUpdated)}
          >
            {answer?.is_pinned ? copy.unpin : copy.pin}
          </Button>
          {answer?.is_published ? (
            <Button type="button" variant="outline" onClick={() => run(() => unpublishSubmission(submission.id), copy.unpublished)}>
              {copy.unpublish}
            </Button>
          ) : null}
          <Link href={`/admin/submissions/${submission.id}/preview`} className={cn(buttonVariants({ variant: 'ghost' }))}>
            {copy.publicPreview}
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border bg-card p-5">
        <h2 className="font-bold">{copy.internalNotes}</h2>
        <ul className="space-y-2 text-sm">
          {(submission.admin_notes ?? []).map((item) => (
            <li key={item.id} className="rounded-xl bg-muted p-3">
              {item.note}
            </li>
          ))}
        </ul>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            run(async () => {
              await addAdminNote(submission.id, note);
              setNote('');
            }, copy.noteAdded)
          }
        >
          {copy.addNote}
        </Button>
      </section>

      <section className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => run(() => archiveSubmission(submission.id), copy.archived)}>
          {copy.archive}
        </Button>
        <Button type="button" variant="outline" onClick={() => run(() => anonymizeSender(submission.id), copy.wipedPersonal)}>
          {copy.wipePersonal}
        </Button>
        <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
          {copy.deleteForever}
        </Button>
      </section>

      <AlertDialog open={confirmPublishOverride} onOpenChange={setConfirmPublishOverride}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.allowPublishAnywayTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.allowPublishAnywayBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmPublishOverride(false);
                void run(async () => {
                  await saveAnswerDraft(contentPayload('anonymous'));
                  await allowPublication(submission.id);
                  setPublicationAllowed(true);
                }, copy.publishAllowedNow);
              }}
            >
              {copy.allowPublishAnyway}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.deleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(async () => {
                  await deleteSubmission(submission.id);
                  router.push('/admin/inbox');
                }, copy.deleted)
              }
            >
              {copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
