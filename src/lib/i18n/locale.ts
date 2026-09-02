import type { Messages } from '@/lib/i18n/ar';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const LOCALE_COOKIE = 'locale';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'ar' || value === 'en';
}

export function dirFor(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function htmlLang(locale: Locale) {
  return locale === 'ar' ? 'ar' : 'en';
}

export function categoryLabel(
  category: { name_ar: string; name_en?: string | null },
  locale: Locale,
) {
  if (locale === 'en' && category.name_en) return category.name_en;
  return category.name_ar;
}

export function localizedAnonymousName(name: string | null | undefined, messages: Messages) {
  if (!name || name === 'مجهول' || name === 'Anonymous') {
    return messages.common.anonymous;
  }
  return name;
}
