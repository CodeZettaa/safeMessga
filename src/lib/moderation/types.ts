import type { ModerationDecision, ModerationProviderName, ViolationCategory } from '@/types/database';

export type ModerationResult = {
  decision: ModerationDecision;
  categories: ViolationCategory[];
  riskScore: number;
  reasonCode: string;
  provider: ModerationProviderName;
};

export type NormalizedContent = {
  original: string;
  normalized: string;
  compact: string;
};

export interface ModerationService {
  moderate(input: {
    title?: string;
    message: string;
    customTerms?: Array<{ term: string; category: ViolationCategory; severity: number }>;
    rejectThreshold: number;
    reviewThreshold: number;
  }): Promise<ModerationResult>;
}

export const REASON_CODES = {
  safe: 'safe',
  insult: 'policy_language',
  harassment: 'policy_conduct',
  threat: 'policy_safety',
  hate: 'policy_respect',
  spam: 'policy_spam',
  links: 'policy_links',
  contact: 'policy_contact',
  uncertain: 'needs_human_review',
} as const;

export type ReasonCode = (typeof REASON_CODES)[keyof typeof REASON_CODES];
