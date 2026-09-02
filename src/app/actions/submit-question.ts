'use server';

import { applyModerationMode, moderationService } from '@/lib/moderation/service';
import { normalizeForModeration } from '@/lib/moderation/normalize';
import { createReferenceCode, hashMessageFingerprint } from '@/lib/anti-abuse/hash';
import {
  evaluateRateLimit,
  isDuplicateFingerprint,
  markSubmission,
  registerRejection,
} from '@/lib/anti-abuse/rate-limit';
import { isHoneypotTriggered } from '@/lib/anti-abuse/honeypot';
import { createCaptchaAdapter } from '@/lib/anti-abuse/captcha';
import { getHashedSenderId } from '@/lib/anti-abuse/sender';
import { getServerEnv, isServerReady } from '@/lib/env';
import { getMessages } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/queries/settings';
import { createServiceClient } from '@/lib/supabase/admin';
import { getDefaultCategoryId } from '@/lib/queries/categories';
import { submissionInputSchema } from '@/lib/validation/submission';
import type { ViolationCategory } from '@/types/database';

export type SubmitQuestionState =
  | { ok: true; referenceCode: string }
  | {
      ok: false;
      code:
        | 'rejected'
        | 'rate_limited'
        | 'blocked'
        | 'cooldown'
        | 'duplicate'
        | 'validation'
        | 'unavailable'
        | 'captcha';
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function submitQuestion(input: unknown): Promise<SubmitQuestionState> {
  const { messages } = await getMessages();
  if (!isServerReady()) {
    return { ok: false, code: 'unavailable', message: messages.ask.unavailable };
  }

  const parsed = submissionInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return {
      ok: false,
      code: 'validation',
      message: messages.ask.checkFields,
      fieldErrors,
    };
  }

  const data = parsed.data;
  if (isHoneypotTriggered(data.website)) {
    return { ok: false, code: 'rejected', message: messages.ask.rejected };
  }

  const settings = await getSiteSettings();
  const env = getServerEnv();
  const captcha = createCaptchaAdapter({
    enabled: settings.captcha_enabled,
    secret: env.turnstileSecretKey,
  });

  if (settings.captcha_enabled) {
    const valid = await captcha.verify(data.captchaToken);
    if (!valid) {
      return { ok: false, code: 'captcha', message: messages.ask.unavailable };
    }
  }

  const senderHash = await getHashedSenderId();
  const rate = evaluateRateLimit(senderHash, {
    windowSeconds: settings.rate_limit_window_seconds,
    maxSubmissions: settings.rate_limit_max_submissions,
    cooldownSeconds: settings.cooldown_seconds,
    blockedAttemptsThreshold: settings.blocked_attempts_threshold,
    tempBlockMinutes: settings.temp_block_minutes,
  });

  if (!rate.ok) {
    const message =
      rate.code === 'blocked'
        ? messages.ask.blocked
        : rate.code === 'cooldown'
          ? messages.ask.rateLimited
          : messages.ask.rateLimited;
    return { ok: false, code: rate.code, message };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, code: 'unavailable', message: messages.ask.unavailable };
  }

  const categoryId = data.categoryId ?? (await getDefaultCategoryId());
  if (!categoryId) {
    return { ok: false, code: 'unavailable', message: messages.ask.noCategories };
  }

  const { data: category } = await supabase
    .from('categories')
    .select('id, is_active')
    .eq('id', categoryId)
    .maybeSingle();

  if (!category || !category.is_active) {
    return { ok: false, code: 'validation', message: messages.ask.categoryUnavailable };
  }

  const { data: customTerms } = await supabase
    .from('blocked_terms')
    .select('normalized_term, category, severity')
    .eq('is_active', true);

  const compact = normalizeForModeration(`${data.title ?? ''} ${data.message}`).compact;
  const fingerprint = hashMessageFingerprint(compact, env.senderHashSalt!);

  if (isDuplicateFingerprint(fingerprint)) {
    return { ok: false, code: 'duplicate', message: messages.ask.duplicate };
  }

  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('message_fingerprint', fingerprint)
    .gte('submitted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (existing && existing.length > 0) {
    return { ok: false, code: 'duplicate', message: messages.ask.duplicate };
  }

  // Automated moderation is risk reduction, not a perfect guarantee.
  const rawResult = await moderationService.moderate({
    title: data.title,
    message: data.message,
    customTerms: (customTerms ?? []).map((term) => ({
      term: term.normalized_term as string,
      category: term.category as ViolationCategory,
      severity: Number(term.severity),
    })),
    rejectThreshold: Number(settings.risk_threshold_reject),
    reviewThreshold: Number(settings.risk_threshold_review),
  });

  const result = applyModerationMode(rawResult, settings.moderation_mode);

  if (result.decision === 'rejected') {
    registerRejection(senderHash, {
      windowSeconds: settings.rate_limit_window_seconds,
      maxSubmissions: settings.rate_limit_max_submissions,
      cooldownSeconds: settings.cooldown_seconds,
      blockedAttemptsThreshold: settings.blocked_attempts_threshold,
      tempBlockMinutes: settings.temp_block_minutes,
    });

    await supabase.from('moderation_events').insert({
      sender_hash: senderHash,
      decision: 'rejected',
      reason_code: result.reasonCode,
      risk_score: result.riskScore,
      categories: result.categories,
      provider: result.provider,
    });

    return { ok: false, code: 'rejected', message: messages.ask.rejected };
  }

  const referenceCode = createReferenceCode();
  const expires = new Date();
  expires.setDate(expires.getDate() + settings.retention_days_private_contact);

  const { error } = await supabase.from('submissions').insert({
    reference_code: referenceCode,
    category_id: categoryId,
    original_title: data.title ?? null,
    original_message: data.message,
    identity_mode: data.identityMode,
    sender_display_name:
      data.identityMode === 'identified' ? data.senderDisplayName : null,
    sender_email: data.identityMode === 'identified' ? data.senderEmail ?? null : null,
    sender_linkedin: data.identityMode === 'identified' ? data.senderLinkedin ?? null : null,
    allow_public_name: data.allowPublicName,
    allow_publication: data.allowPublication,
    sender_hash: senderHash,
    message_fingerprint: fingerprint,
    status: result.decision === 'needs_review' ? 'needs_review' : 'pending',
    moderation_decision: result.decision,
    moderation_categories: result.categories,
    moderation_risk_score: result.riskScore,
    moderation_reason_code: result.reasonCode,
    moderation_provider: result.provider,
    private_contact_expires_at: expires.toISOString(),
  });

  if (error) {
    return { ok: false, code: 'unavailable', message: messages.ask.unavailable };
  }

  markSubmission(senderHash);
  return { ok: true, referenceCode };
}
