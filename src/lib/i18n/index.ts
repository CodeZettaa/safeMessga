import { cookies } from 'next/headers';
import { ar, type Messages } from '@/lib/i18n/ar';
import { en } from '@/lib/i18n/en';
import {
  LOCALE_COOKIE,
  defaultLocale,
  dirFor,
  isLocale,
  type Locale,
} from '@/lib/i18n/locale';

const dictionaries: Record<Locale, Messages> = { ar, en };

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getMessages() {
  const locale = await getLocale();
  return {
    locale,
    messages: dictionaries[locale],
    dir: dirFor(locale),
  };
}

export type { Locale, Messages };
export {
  categoryLabel,
  defaultLocale,
  dirFor,
  htmlLang,
  isLocale,
  localizedAnonymousName,
  locales,
  LOCALE_COOKIE,
} from '@/lib/i18n/locale';
