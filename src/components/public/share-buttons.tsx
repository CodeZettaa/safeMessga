'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const { messages } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? <Check /> : <Link2 />}
        {copied ? messages.questions.copied : messages.questions.copyLink}
      </Button>
      <a
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noreferrer"
      >
        X
      </a>
      <a
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noreferrer"
      >
        LinkedIn
      </a>
    </div>
  );
}
