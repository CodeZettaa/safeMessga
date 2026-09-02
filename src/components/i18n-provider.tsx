'use client';

import { createContext, useContext } from 'react';
import { en } from '@/lib/i18n/en';
import type { Messages } from '@/lib/i18n/ar';
import type { Locale } from '@/lib/i18n/locale';

type I18nValue = {
  locale: Locale;
  messages: Messages;
};

const I18nContext = createContext<I18nValue>({
  locale: 'en',
  messages: en,
});

export function I18nProvider({
  locale,
  messages,
  children,
}: I18nValue & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
