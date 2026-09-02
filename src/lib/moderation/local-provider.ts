import { bundledBlockedTerms } from '@/lib/moderation/blocked-terms.server';
import { normalizeForModeration } from '@/lib/moderation/normalize';
import { REASON_CODES, type ModerationResult } from '@/lib/moderation/types';
import type { ViolationCategory } from '@/types/database';

const PHONE_RE =
  /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/;
const URL_RE = /https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/|t\.co\/|tinyurl\.com/i;
const CONTACT_RE = /واتساب|whatsapp|تليجرام|telegram|telegram\.me|wa\.me/i;
const SPAM_REPEAT_RE = /(.{8,})\1{3,}/;

const CATEGORY_REASON: Record<ViolationCategory, string> = {
  insult_ar: REASON_CODES.insult,
  insult_en: REASON_CODES.insult,
  insult_arabizi: REASON_CODES.insult,
  sexual_harassment: REASON_CODES.harassment,
  threat: REASON_CODES.threat,
  hate_speech: REASON_CODES.hate,
  personal_attack: REASON_CODES.insult,
  spam: REASON_CODES.spam,
  suspicious_link: REASON_CODES.links,
  contact_solicitation: REASON_CODES.contact,
};

function clampScore(value: number) {
  return Math.min(1, Math.max(0, Number(value.toFixed(3))));
}

function includesTerm(haystack: string, term: string) {
  const compactTerm = normalizeForModeration(term).compact;
  if (!compactTerm) return false;
  return haystack.includes(compactTerm);
}

export function moderateLocally(input: {
  title?: string;
  message: string;
  customTerms?: Array<{ term: string; category: ViolationCategory; severity: number }>;
  rejectThreshold: number;
  reviewThreshold: number;
}): ModerationResult {
  const combined = `${input.title ?? ''}\n${input.message}`;
  const { normalized, compact } = normalizeForModeration(combined);
  const terms = [...bundledBlockedTerms, ...(input.customTerms ?? [])];

  const categories = new Set<ViolationCategory>();
  let highest = 0;

  for (const term of terms) {
    if (includesTerm(compact, term.term) || includesTerm(normalized.replace(/\s+/g, ''), term.term)) {
      categories.add(term.category);
      highest = Math.max(highest, term.severity / 5);
    }
  }

  if (PHONE_RE.test(normalized)) {
    categories.add('contact_solicitation');
    highest = Math.max(highest, 0.62);
  }

  if (URL_RE.test(normalized)) {
    categories.add('suspicious_link');
    highest = Math.max(highest, 0.58);
  }

  if (CONTACT_RE.test(normalized) || CONTACT_RE.test(compact)) {
    categories.add('contact_solicitation');
    highest = Math.max(highest, 0.6);
  }

  if (SPAM_REPEAT_RE.test(compact) || compact.length > 0 && new Set(compact).size <= 2 && compact.length >= 20) {
    categories.add('spam');
    highest = Math.max(highest, 0.7);
  }

  const riskScore = clampScore(highest);
  const categoryList = [...categories];

  let decision: ModerationResult['decision'] = 'accepted';
  let reasonCode: string = REASON_CODES.safe;

  if (riskScore >= input.rejectThreshold && categoryList.length > 0) {
    decision = 'rejected';
    reasonCode = CATEGORY_REASON[categoryList[0]!] ?? REASON_CODES.insult;
  } else if (riskScore >= input.reviewThreshold && categoryList.length > 0) {
    decision = 'needs_review';
    reasonCode = REASON_CODES.uncertain;
  }

  return {
    decision,
    categories: categoryList,
    riskScore,
    reasonCode,
    provider: 'local',
  };
}
