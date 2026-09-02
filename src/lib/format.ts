import { arEG, enUS } from 'date-fns/locale';
import { formatDistanceToNow, format } from 'date-fns';
import type { Locale } from '@/lib/i18n/locale';

export function formatDate(value: string | Date, locale: Locale = 'en') {
  return format(new Date(value), 'd MMMM yyyy', {
    locale: locale === 'en' ? enUS : arEG,
  });
}

export function formatRelative(value: string | Date, locale: Locale = 'en') {
  return formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: locale === 'en' ? enUS : arEG,
  });
}
