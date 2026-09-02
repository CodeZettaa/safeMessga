import { siteConfig } from '@/lib/config';
import { looksLikeEmail, looksLikeLinkedIn, stripPrivateContact } from '@/lib/validation/sanitize';
import type { IdentityMode } from '@/types/database';

export class PublishAuthorizationError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'PublishAuthorizationError';
  }
}

export type PublishableSubmission = {
  allow_publication: boolean;
  allow_public_name: boolean;
  identity_mode: IdentityMode;
  sender_display_name: string | null;
  sender_email: string | null;
  sender_linkedin: string | null;
};

export function assertCanPublish(submission: PublishableSubmission) {
  if (!submission.allow_publication) {
    throw new PublishAuthorizationError('publication_forbidden');
  }
}

export function fallbackPublicTitle(body: string, maxLength = siteConfig.limits.maxTitleLength) {
  const line = body.trim().split(/\n/)[0]?.trim() ?? '';
  return line.slice(0, maxLength);
}

export function preparePublishContent(input: {
  title: string;
  body: string;
  answer: string;
  fallbackBody?: string;
}) {
  const body = input.body.trim() || (input.fallbackBody ?? '').trim();
  const answer = input.answer.trim();
  const title = input.title.trim() || fallbackPublicTitle(body);

  if (!title) throw new PublishAuthorizationError('publish_title_required');
  if (!body) throw new PublishAuthorizationError('publish_body_required');
  if (!answer) throw new PublishAuthorizationError('publish_answer_required');

  return { title, body, answer };
}

export function resolvePublicDisplayName(
  submission: PublishableSubmission,
  adminChoice: 'anonymous' | 'named',
) {
  if (!submission.allow_public_name || submission.identity_mode === 'anonymous') {
    return siteConfig.anonymousDisplayName;
  }

  if (adminChoice === 'anonymous') {
    return siteConfig.anonymousDisplayName;
  }

  return submission.sender_display_name || siteConfig.anonymousDisplayName;
}

export function sanitizePublicFields(input: {
  submission: PublishableSubmission;
  title: string;
  body: string;
  answer: string;
  displayName: string;
}) {
  const privateValues = [input.submission.sender_email, input.submission.sender_linkedin];
  const title = stripPrivateContact(input.title, privateValues);
  const body = stripPrivateContact(input.body, privateValues);
  const answer = stripPrivateContact(input.answer, privateValues);
  let displayName = input.displayName;

  if (looksLikeEmail(displayName) || looksLikeLinkedIn(displayName)) {
    displayName = siteConfig.anonymousDisplayName;
  }

  if (
    looksLikeEmail(title) ||
    looksLikeEmail(body) ||
    looksLikeLinkedIn(title) ||
    looksLikeLinkedIn(body)
  ) {
    throw new PublishAuthorizationError('private_contact_in_public_content');
  }

  return { title, body, answer, displayName };
}

export type PublicQuestionDto = ReturnType<typeof toPublicQuestionDto>;

export function toPublicQuestionDto(row: {
  slug: string;
  title: string;
  question_body: string;
  answer_body: string;
  display_name: string;
  is_pinned: boolean;
  view_count: number;
  published_at: string;
  category_key: string;
  category_name_ar: string;
  category_name_en?: string | null;
  category_icon: string;
  category_color: string;
}) {
  return {
    slug: row.slug,
    title: row.title,
    questionBody: row.question_body,
    answerBody: row.answer_body,
    displayName: row.display_name,
    isPinned: row.is_pinned,
    viewCount: row.view_count,
    publishedAt: row.published_at,
    category: {
      key: row.category_key,
      nameAr: row.category_name_ar,
      nameEn: row.category_name_en ?? null,
      icon: row.category_icon,
      color: row.category_color,
    },
  };
}

export function assertNoPrivateLeak(payload: unknown) {
  const json = JSON.stringify(payload).toLowerCase();
  const forbidden = [
    'sender_email',
    'sender_linkedin',
    'sender_hash',
    'message_fingerprint',
    'original_message',
    'original_title',
  ];

  for (const key of forbidden) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`private_field_leaked:${key}`);
    }
  }
}
