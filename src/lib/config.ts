export const siteConfig = {
  name: 'Ask Nourhan',
  nameAr: 'اسأل نورهان',
  ownerName: 'Nourhan Saeed',
  ownerNameAr: 'نورهان سعيد',
  brand: 'CodeZetta',
  tagline: 'A safe space for questions and messages',
  locale: 'en',
  defaultLocale: 'en',
  dir: 'ltr' as const,
  anonymousDisplayName: 'مجهول',
  social: {
    linkedin: 'https://www.linkedin.com/',
    youtube: 'https://www.youtube.com/',
    instagram: 'https://www.instagram.com/',
    x: 'https://x.com/',
  },
  seo: {
    titleTemplate: '%s | Ask Nourhan',
    defaultDescription:
      'Send Nourhan Saeed a question or message, with your name or anonymously. Nothing is published until she reviews it.',
  },
  limits: {
    minMessageLength: 10,
    maxMessageLength: 2000,
    maxTitleLength: 160,
    maxDisplayNameLength: 80,
  },
} as const;

export type SiteConfig = typeof siteConfig;

export const categoryIconNames = [
  'code',
  'briefcase',
  'graduation-cap',
  'sparkles',
  'message-circle',
  'message-circle-heart',
  'heart',
  'lightbulb',
  'book-open',
  'laptop',
] as const;

export type CategoryIconName = (typeof categoryIconNames)[number];
