'use client';

import { setLocale } from '@/app/actions/locale';
import { useI18n } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';

export function LocaleSwitcher() {
  const { locale, messages } = useI18n();

  return (
    <div
      className="flex items-center rounded-full border border-border bg-background p-0.5 text-xs font-semibold"
      role="group"
      aria-label={messages.common.language}
    >
      {(['en', 'ar'] as const).map((value) => (
        <form key={value} action={setLocale}>
          <input type="hidden" name="locale" value={value} />
          <button
            type="submit"
            className={cn(
              'rounded-full px-2.5 py-1 transition',
              locale === value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={locale === value}
          >
            {value === 'ar' ? 'عربي' : 'EN'}
          </button>
        </form>
      ))}
    </div>
  );
}
