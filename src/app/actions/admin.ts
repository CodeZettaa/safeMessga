'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { siteConfig } from '@/lib/config';
import { createServiceClient } from '@/lib/supabase/admin';
import { slugifyTitle, uniqueSlug } from '@/lib/validation/slug';
import {
  PublishAuthorizationError,
  assertCanPublish,
  preparePublishContent,
  resolvePublicDisplayName,
  sanitizePublicFields,
} from '@/lib/validation/publishing';
import { stripHtml } from '@/lib/validation/sanitize';

function publishErrorMessage(message: string) {
  if (message.includes('answers_published_requires_content')) {
    return 'publish_content_required';
  }
  return message;
}

function asActionError(error: unknown): never {
  if (error instanceof PublishAuthorizationError) {
    throw new Error(error.code);
  }
  throw error;
}

async function adminClient() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    throw new Error('UNAUTHORIZED');
  }
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error('UNAVAILABLE');
  }
  return supabase;
}

export async function addAdminNote(submissionId: string, note: string) {
  const supabase = await adminClient();
  const trimmed = stripHtml(note);
  if (!trimmed) throw new Error('EMPTY_NOTE');
  const { error } = await supabase.from('admin_notes').insert({
    submission_id: submissionId,
    note: trimmed,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/submissions/${submissionId}`);
}

export async function updateSubmissionCategory(submissionId: string, categoryId: string) {
  const supabase = await adminClient();
  const { error } = await supabase
    .from('submissions')
    .update({ category_id: categoryId })
    .eq('id', submissionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath('/admin/inbox');
}

export async function saveAnswerDraft(input: {
  submissionId: string;
  answerBody: string;
  publicQuestionTitle: string;
  publicQuestionBody: string;
  displayChoice: 'anonymous' | 'named';
}) {
  const supabase = await adminClient();
  const { data: submission, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', input.submissionId)
    .single();
  if (error || !submission) throw new Error('NOT_FOUND');

  const displayName = resolvePublicDisplayName(submission, input.displayChoice);
  const sanitized = sanitizePublicFields({
    submission,
    title: stripHtml(input.publicQuestionTitle),
    body: stripHtml(input.publicQuestionBody),
    answer: stripHtml(input.answerBody),
    displayName,
  });

  const { data: existing } = await supabase
    .from('answers')
    .select('id')
    .eq('submission_id', input.submissionId)
    .maybeSingle();

  const payload = {
    submission_id: input.submissionId,
    answer_body: sanitized.answer,
    public_question_title: sanitized.title,
    public_question_body: sanitized.body,
    public_display_name: sanitized.displayName,
    is_draft: true,
  };

  if (existing) {
    await supabase.from('answers').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('answers').insert(payload);
  }

  revalidatePath(`/admin/submissions/${input.submissionId}`);
}

export async function markAnswered(submissionId: string) {
  const supabase = await adminClient();
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'answered' })
    .eq('id', submissionId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/inbox');
  revalidatePath(`/admin/submissions/${submissionId}`);
}

export async function publishSubmission(input: {
  submissionId: string;
  answerBody: string;
  publicQuestionTitle: string;
  publicQuestionBody: string;
  displayChoice: 'anonymous' | 'named';
  pin: boolean;
}) {
  const supabase = await adminClient();
  const { data: submission, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', input.submissionId)
    .single();
  if (error || !submission) throw new Error('NOT_FOUND');

  try {
    assertCanPublish(submission);
  } catch (err) {
    asActionError(err);
  }

  const displayName = resolvePublicDisplayName(submission, input.displayChoice);
  let sanitized;
  try {
    sanitized = sanitizePublicFields({
      submission,
      title: stripHtml(input.publicQuestionTitle),
      body: stripHtml(input.publicQuestionBody),
      answer: stripHtml(input.answerBody),
      displayName,
    });
  } catch (err) {
    asActionError(err);
  }

  let prepared;
  try {
    prepared = preparePublishContent({
      title: sanitized.title,
      body: sanitized.body,
      answer: sanitized.answer,
      fallbackBody: submission.original_message,
    });
  } catch (err) {
    asActionError(err);
  }

  const { data: slugs } = await supabase.from('answers').select('slug, submission_id');
  const existingSlugs = (slugs ?? [])
    .filter((row) => row.submission_id !== input.submissionId && row.slug)
    .map((row) => row.slug as string);
  const slug = uniqueSlug(slugifyTitle(prepared.title), existingSlugs);

  const { data: existing } = await supabase
    .from('answers')
    .select('id')
    .eq('submission_id', input.submissionId)
    .maybeSingle();

  const payload = {
    submission_id: input.submissionId,
    answer_body: prepared.answer,
    public_question_title: prepared.title,
    public_question_body: prepared.body,
    public_display_name: sanitized.displayName,
    slug,
    is_published: true,
    is_pinned: input.pin,
    is_draft: false,
    published_at: new Date().toISOString(),
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from('answers')
      .update(payload)
      .eq('id', existing.id);
    if (updateError) throw new Error(publishErrorMessage(updateError.message));
  } else {
    const { error: insertError } = await supabase.from('answers').insert(payload);
    if (insertError) throw new Error(publishErrorMessage(insertError.message));
  }

  await supabase.from('submissions').update({ status: 'answered' }).eq('id', input.submissionId);

  revalidatePath('/questions');
  revalidatePath(`/questions/${slug}`);
  revalidatePath('/admin/inbox');
  revalidatePath(`/admin/submissions/${input.submissionId}`);
  return { slug };
}

export async function unpublishSubmission(submissionId: string) {
  const supabase = await adminClient();
  await supabase
    .from('answers')
    .update({ is_published: false, is_draft: true })
    .eq('submission_id', submissionId);
  revalidatePath('/questions');
  revalidatePath(`/admin/submissions/${submissionId}`);
}

export async function allowPublication(submissionId: string) {
  const supabase = await adminClient();
  const { error } = await supabase
    .from('submissions')
    .update({ allow_publication: true })
    .eq('id', submissionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath('/admin/inbox');
}

export async function archiveSubmission(submissionId: string) {
  const supabase = await adminClient();
  await supabase.from('submissions').update({ status: 'archived' }).eq('id', submissionId);
  revalidatePath('/admin/inbox');
}

export async function togglePin(submissionId: string, pinned: boolean) {
  const supabase = await adminClient();
  await supabase.from('answers').update({ is_pinned: pinned }).eq('submission_id', submissionId);
  revalidatePath('/questions');
  revalidatePath(`/admin/submissions/${submissionId}`);
}

export async function anonymizeSender(submissionId: string) {
  const supabase = await adminClient();
  await supabase
    .from('submissions')
    .update({
      sender_display_name: null,
      sender_email: null,
      sender_linkedin: null,
      identity_mode: 'anonymous',
      allow_public_name: false,
    })
    .eq('id', submissionId);

  await supabase
    .from('answers')
    .update({ public_display_name: siteConfig.anonymousDisplayName })
    .eq('submission_id', submissionId);

  revalidatePath(`/admin/submissions/${submissionId}`);
}

export async function deleteSubmission(submissionId: string) {
  const supabase = await adminClient();
  await supabase.from('answers').delete().eq('submission_id', submissionId);
  await supabase.from('admin_notes').delete().eq('submission_id', submissionId);
  await supabase.from('submissions').delete().eq('id', submissionId);
  revalidatePath('/admin/inbox');
  revalidatePath('/questions');
}

export async function upsertCategory(input: {
  id?: string;
  key: string;
  nameAr: string;
  nameEn?: string;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}) {
  const supabase = await adminClient();
  const payload = {
    key: input.key.trim().toLowerCase(),
    name_ar: stripHtml(input.nameAr),
    name_en: input.nameEn ? stripHtml(input.nameEn) : null,
    icon: input.icon,
    color: input.color,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };

  if (input.id) {
    const { error } = await supabase.from('categories').update(payload).eq('id', input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('categories').insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/ask');
  revalidatePath('/admin/categories');
}

export async function addBlockedTerm(input: {
  term: string;
  language: 'ar' | 'en' | 'arabizi' | 'mixed';
  category: string;
  severity: number;
}) {
  const supabase = await adminClient();
  const { error } = await supabase.from('blocked_terms').insert({
    normalized_term: input.term.trim().toLowerCase(),
    language: input.language,
    category: input.category,
    severity: input.severity,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/settings');
}

export async function deactivateBlockedTerm(id: string) {
  const supabase = await adminClient();
  await supabase.from('blocked_terms').update({ is_active: false }).eq('id', id);
  revalidatePath('/admin/settings');
}

export async function updateSiteSettings(input: {
  moderation_mode: 'strict' | 'balanced';
  rate_limit_window_seconds: number;
  rate_limit_max_submissions: number;
  cooldown_seconds: number;
  risk_threshold_reject: number;
  risk_threshold_review: number;
  retention_days_private_contact: number;
  blocked_attempts_threshold: number;
  temp_block_minutes: number;
}) {
  const supabase = await adminClient();
  const { error } = await supabase
    .from('site_settings')
    .update(input)
    .eq('id', 1);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/settings');
}
