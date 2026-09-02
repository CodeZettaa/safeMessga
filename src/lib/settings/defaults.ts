import type { SiteSettings } from '@/types/database';

export const defaultSiteSettings: SiteSettings = {
  id: 1,
  moderation_mode: 'balanced',
  rate_limit_window_seconds: 600,
  rate_limit_max_submissions: 3,
  cooldown_seconds: 30,
  risk_threshold_reject: 0.8,
  risk_threshold_review: 0.45,
  retention_days_private_contact: 180,
  blocked_attempts_threshold: 3,
  temp_block_minutes: 60,
  captcha_enabled: false,
  updated_at: new Date(0).toISOString(),
};
