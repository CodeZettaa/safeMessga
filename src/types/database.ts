export type IdentityMode = 'anonymous' | 'identified';

export type SubmissionStatus = 'pending' | 'needs_review' | 'answered' | 'archived';

export type ModerationDecision = 'accepted' | 'needs_review' | 'rejected';

export type ModerationMode = 'strict' | 'balanced';

export type ModerationProviderName = 'local' | 'external';

export type BlockedTermLanguage = 'ar' | 'en' | 'arabizi' | 'mixed';

export type ViolationCategory =
  | 'insult_ar'
  | 'insult_en'
  | 'insult_arabizi'
  | 'sexual_harassment'
  | 'threat'
  | 'hate_speech'
  | 'personal_attack'
  | 'spam'
  | 'suspicious_link'
  | 'contact_solicitation';

export type Category = {
  id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
};

export type Submission = {
  id: string;
  reference_code: string;
  category_id: string;
  original_title: string | null;
  original_message: string;
  identity_mode: IdentityMode;
  sender_display_name: string | null;
  sender_email: string | null;
  sender_linkedin: string | null;
  allow_public_name: boolean;
  allow_publication: boolean;
  sender_hash: string;
  message_fingerprint: string;
  status: SubmissionStatus;
  moderation_decision: ModerationDecision;
  moderation_categories: string[];
  moderation_risk_score: number;
  moderation_reason_code: string;
  moderation_provider: string;
  submitted_at: string;
  updated_at: string;
  private_contact_expires_at: string | null;
};

export type Answer = {
  id: string;
  submission_id: string;
  answer_body: string;
  public_question_title: string | null;
  public_question_body: string | null;
  public_display_name: string;
  slug: string | null;
  is_published: boolean;
  is_pinned: boolean;
  is_draft: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminNote = {
  id: string;
  submission_id: string;
  note: string;
  created_at: string;
};

export type SiteSettings = {
  id: number;
  moderation_mode: ModerationMode;
  rate_limit_window_seconds: number;
  rate_limit_max_submissions: number;
  cooldown_seconds: number;
  risk_threshold_reject: number;
  risk_threshold_review: number;
  retention_days_private_contact: number;
  blocked_attempts_threshold: number;
  temp_block_minutes: number;
  captcha_enabled: boolean;
  updated_at: string;
};

export type PublishedQuestion = {
  id: string;
  slug: string;
  title: string;
  question_body: string;
  answer_body: string;
  display_name: string;
  is_pinned: boolean;
  view_count: number;
  published_at: string;
  category_id: string;
  category_key: string;
  category_name_ar: string;
  category_icon: string;
  category_color: string;
};

export type InboxSubmission = Submission & {
  categories: Pick<Category, 'id' | 'key' | 'name_ar' | 'name_en' | 'color'> | null;
  answers: Pick<
    Answer,
    'id' | 'is_published' | 'is_draft' | 'slug' | 'public_display_name'
  > | null;
};
