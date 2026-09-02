'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n-provider';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  const { messages } = useI18n();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold">{messages.common.notFound}</h1>
      <p className="mt-3 text-muted-foreground">{messages.common.notFoundBody}</p>
      <Link href="/" className={cn(buttonVariants(), 'mt-6')}>
        {messages.nav.home}
      </Link>
    </div>
  );
}
