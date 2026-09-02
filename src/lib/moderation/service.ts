import 'server-only';

import { moderateWithExternalProvider } from '@/lib/moderation/external-provider';
import { moderateLocally } from '@/lib/moderation/local-provider';
import type { ModerationResult, ModerationService } from '@/lib/moderation/types';
import type { ModerationMode } from '@/types/database';

/**
 * Layered moderation. Automated checks reduce risk; they are not a perfect
 * guarantee. Admins still review inbound messages before anything is public.
 */
export class DefaultModerationService implements ModerationService {
  async moderate(input: {
    title?: string;
    message: string;
    customTerms?: Array<{
      term: string;
      category: import('@/types/database').ViolationCategory;
      severity: number;
    }>;
    rejectThreshold: number;
    reviewThreshold: number;
  }): Promise<ModerationResult> {
    const local = moderateLocally(input);
    const external = await moderateWithExternalProvider(input).catch(() => null);

    if (!external) {
      return local;
    }

    const riskScore = Math.max(local.riskScore, external.riskScore);
    const categories = [...new Set([...local.categories, ...external.categories])];
    let decision: ModerationResult['decision'] = 'accepted';
    let reasonCode = local.reasonCode;

    if (local.decision === 'rejected' || external.decision === 'rejected') {
      decision = 'rejected';
      reasonCode = local.decision === 'rejected' ? local.reasonCode : external.reasonCode;
    } else if (local.decision === 'needs_review' || external.decision === 'needs_review') {
      decision = 'needs_review';
      reasonCode = 'needs_human_review';
    }

    return {
      decision,
      categories,
      riskScore,
      reasonCode,
      provider: external.provider,
    };
  }
}

export function applyModerationMode(
  result: ModerationResult,
  mode: ModerationMode,
): ModerationResult {
  if (mode === 'strict' && result.decision === 'needs_review') {
    return {
      ...result,
      decision: 'rejected',
      reasonCode: result.reasonCode === 'safe' ? 'needs_human_review' : result.reasonCode,
    };
  }

  return result;
}

export const moderationService = new DefaultModerationService();
