import type { NormalizedContent } from '@/lib/moderation/types';

const TASHKEEL = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;
const ALEF = /[أإآٱ]/g;
const YEH = /[ىئ]/g;
const TEH_MARBUTA = /ة/g;
const WAW = /ؤ/g;
const NON_ALNUM = /[^\p{L}\p{N}]+/gu;
const REPEATED = /(.)\1{1,}/g;

const ARABIZI_TOKENS: Array<[RegExp, string]> = [
  [/\bkosom\b/g, 'كسم'],
  [/\bksmk\b/g, 'كسم'],
  [/\bksm\b/g, 'كسم'],
  [/\bsharmota\b/g, 'شرموط'],
  [/\bsharmota\b/g, 'شرموط'],
  [/\b3ars\b/g, 'عرص'],
  [/\bars\b/g, 'عرص'],
  [/\bkhawal\b/g, 'خول'],
  [/\b5awal\b/g, 'خول'],
  [/\byakhara\b/g, 'ياخرا'],
  [/\bya5ra\b/g, 'ياخرا'],
  [/\bnigga\b/g, 'slur'],
];

const ARABIZI_DIGITS: Record<string, string> = {
  '2': 'ا',
  '3': 'ع',
  '5': 'خ',
  '6': 'ط',
  '7': 'ح',
  '8': 'غ',
  '9': 'ص',
};

function mapArabiziDigits(value: string) {
  return value.replace(/[2356789]/g, (digit) => ARABIZI_DIGITS[digit] ?? digit);
}

function applyArabiziTokens(value: string) {
  return ARABIZI_TOKENS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );
}

/**
 * Normalize text for moderation only. The original message is kept for valid
 * submissions. Compact form strips separators used to bypass filters.
 */
export function normalizeForModeration(input: string): NormalizedContent {
  const original = input;
  let normalized = input.normalize('NFKC').toLowerCase();
  normalized = normalized.replace(TATWEEL, '');
  normalized = normalized.replace(TASHKEEL, '');
  normalized = normalized.replace(ALEF, 'ا');
  normalized = normalized.replace(YEH, 'ي');
  normalized = normalized.replace(TEH_MARBUTA, 'ه');
  normalized = normalized.replace(WAW, 'و');
  normalized = applyArabiziTokens(normalized);
  normalized = mapArabiziDigits(normalized);
  normalized = normalized.replace(/\s+/g, ' ').trim();

  const compact = normalized.replace(NON_ALNUM, '').replace(REPEATED, '$1');

  return { original, normalized, compact };
}

export function fingerprintMessage(normalizedCompact: string) {
  return normalizedCompact.slice(0, 4000);
}
