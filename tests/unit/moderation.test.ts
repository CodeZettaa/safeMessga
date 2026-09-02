import { describe, expect, it } from 'vitest';
import { normalizeForModeration } from '@/lib/moderation/normalize';
import { moderateLocally } from '@/lib/moderation/local-provider';
import { applyModerationMode } from '@/lib/moderation/service';

const thresholds = { rejectThreshold: 0.8, reviewThreshold: 0.45 };

describe('Arabic and Arabizi normalization', () => {
  it('collapses tatweel, tashkeel, and spaced letters', () => {
    const spaced = normalizeForModeration('كــ سْ م');
    const compactInsult = normalizeForModeration('كسم').compact;
    expect(spaced.compact.includes(compactInsult) || spaced.compact.includes('كسم')).toBe(true);
  });

  it('maps common Arabizi insults before matching', () => {
    const result = moderateLocally({
      message: 'ya kosom',
      ...thresholds,
    });
    expect(result.decision).toBe('rejected');
    expect(result.categories.length).toBeGreaterThan(0);
  });
});

describe('local moderation', () => {
  it('accepts a polite technical question', () => {
    const result = moderateLocally({
      title: 'React',
      message: 'إزاي أبدأ أتعلم React وأعمل أول مشروع صغير؟',
      ...thresholds,
    });
    expect(result.decision).toBe('accepted');
    expect(result.riskScore).toBeLessThan(0.45);
  });

  it('rejects a clearly offensive Arabic insult', () => {
    const result = moderateLocally({
      message: 'يا كسم الكورس ده',
      ...thresholds,
    });
    expect(result.decision).toBe('rejected');
    expect(result.reasonCode).not.toMatch(/كسم/);
  });

  it('sends mild personal attacks to review in balanced thresholds', () => {
    const result = moderateLocally({
      message: 'يا حقير شرحك وحش',
      ...thresholds,
    });
    expect(result.decision).toBe('needs_review');
  });

  it('strict mode rejects uncertain messages', () => {
    const uncertain = moderateLocally({
      message: 'يا حقير شرحك وحش',
      ...thresholds,
    });
    const strict = applyModerationMode(uncertain, 'strict');
    expect(strict.decision).toBe('rejected');
  });
});
