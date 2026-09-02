import { describe, expect, it } from 'vitest';
import { submissionInputSchema } from '@/lib/validation/submission';
import {
  assertCanPublish,
  preparePublishContent,
  PublishAuthorizationError,
  resolvePublicDisplayName,
  sanitizePublicFields,
  toPublicQuestionDto,
  assertNoPrivateLeak,
} from '@/lib/validation/publishing';
import { stripHtml } from '@/lib/validation/sanitize';
import { uniqueSlug } from '@/lib/validation/slug';
import { siteConfig } from '@/lib/config';

const base = {
  message: 'عايزة أعرف إزاي أبدأ في Next.js بشكل مرتب.',
  website: '',
};

describe('submission identity rules', () => {
  it('accepts an anonymous submission with only a message', () => {
    const parsed = submissionInputSchema.parse(base);
    expect(parsed.identityMode).toBe('anonymous');
    expect(parsed.allowPublication).toBe(true);
    expect(parsed.senderDisplayName).toBeFalsy();
  });

  it('treats a provided name as an identified sender', () => {
    const parsed = submissionInputSchema.parse({
      ...base,
      senderDisplayName: 'نورة',
    });
    expect(parsed.identityMode).toBe('identified');
    expect(parsed.allowPublicName).toBe(true);
    expect(parsed.senderDisplayName).toBe('نورة');
  });

  it('requires a display name when identity is identified', () => {
    const parsed = submissionInputSchema.safeParse({
      ...base,
      identityMode: 'identified',
    });
    expect(parsed.success).toBe(false);
  });

  it('keeps email private on identified submissions', () => {
    const parsed = submissionInputSchema.parse({
      ...base,
      senderDisplayName: 'نورة',
      senderEmail: 'private@example.com',
    });
    expect(parsed.senderEmail).toBe('private@example.com');
    expect(parsed.allowPublicName).toBe(true);
  });
});

describe('publishing authorization', () => {
  const forbidden = {
    allow_publication: false,
    allow_public_name: false,
    identity_mode: 'anonymous' as const,
    sender_display_name: null,
    sender_email: null,
    sender_linkedin: null,
  };

  it('forbids publishing when the sender opted out', () => {
    expect(() => assertCanPublish(forbidden)).toThrow(PublishAuthorizationError);
  });

  it('requires an answer and fills a missing title from the question body', () => {
    expect(() =>
      preparePublishContent({
        title: '',
        body: 'How do I start with Next.js?',
        answer: '',
      }),
    ).toThrow(PublishAuthorizationError);

    const prepared = preparePublishContent({
      title: '   ',
      body: 'How do I start with Next.js?\nMore detail here.',
      answer: 'Start with the docs and a small app.',
    });
    expect(prepared.title).toBe('How do I start with Next.js?');
    expect(prepared.answer).toBe('Start with the docs and a small app.');
  });

  it('forces anonymous display when public-name permission is false', () => {
    const name = resolvePublicDisplayName(
      {
        allow_publication: true,
        allow_public_name: false,
        identity_mode: 'identified',
        sender_display_name: 'نورة',
        sender_email: 'noura@example.com',
        sender_linkedin: null,
      },
      'named',
    );
    expect(name).toBe(siteConfig.anonymousDisplayName);
  });

  it('strips private contact from public fields', () => {
    const result = sanitizePublicFields({
      submission: {
        allow_publication: true,
        allow_public_name: true,
        identity_mode: 'identified',
        sender_display_name: 'نورة',
        sender_email: 'noura@example.com',
        sender_linkedin: 'https://linkedin.com/in/noura',
      },
      title: 'سؤال',
      body: 'كلمني على noura@example.com',
      answer: 'تمام',
      displayName: 'نورة',
    });
    expect(result.body.includes('noura@example.com')).toBe(false);
  });
});

describe('public DTO and XSS', () => {
  it('never includes private keys in public question payloads', () => {
    const dto = toPublicQuestionDto({
      slug: 'test',
      title: 'عنوان',
      question_body: 'سؤال',
      answer_body: 'إجابة',
      display_name: 'مجهول',
      is_pinned: false,
      view_count: 3,
      published_at: new Date().toISOString(),
      category_key: 'technical',
      category_name_ar: 'سؤال تقني',
      category_icon: 'code',
      category_color: '#5B3A8C',
    });
    expect(() => assertNoPrivateLeak(dto)).not.toThrow();
    expect(JSON.stringify(dto)).not.toMatch(/sender_email|sender_hash|original_message/);
  });

  it('strips HTML and script payloads while keeping code text', () => {
    const cleaned = stripHtml('الكود: console.log(1) <script>alert(1)</script>');
    expect(cleaned.includes('<script>')).toBe(false);
    expect(cleaned.includes('console.log(1)')).toBe(true);
  });

  it('generates unique slugs', () => {
    expect(uniqueSlug('question', ['question', 'question-2'])).toBe('question-3');
  });
});
