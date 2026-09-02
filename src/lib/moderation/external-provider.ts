import 'server-only';

import type { ModerationResult } from '@/lib/moderation/types';
import { getServerEnv } from '@/lib/env';

/**
 * Optional adapter. The platform runs without any paid API.
 * Set MODERATION_PROVIDER=openai and OPENAI_API_KEY to enable later.
 */
export async function moderateWithExternalProvider(input: {
  title?: string;
  message: string;
}): Promise<ModerationResult | null> {
  const env = getServerEnv();
  if (env.moderationProvider !== 'openai' || !env.openaiApiKey) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.openaiModerationModel,
      input: `${input.title ?? ''}\n${input.message}`,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    results?: Array<{
      flagged?: boolean;
      category_scores?: Record<string, number>;
      categories?: Record<string, boolean>;
    }>;
  };

  const result = payload.results?.[0];
  if (!result) return null;

  const scores = Object.values(result.category_scores ?? {});
  const riskScore = scores.length ? Math.min(1, Math.max(0, ...scores)) : result.flagged ? 0.9 : 0;
  const flagged = Boolean(result.flagged);

  return {
    decision: flagged ? (riskScore >= 0.85 ? 'rejected' : 'needs_review') : 'accepted',
    categories: [],
    riskScore,
    reasonCode: flagged ? 'external_flag' : 'safe',
    provider: 'external',
  };
}
