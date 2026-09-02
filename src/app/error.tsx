'use client';

import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { messages } = useI18n();

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">{messages.common.error}</h1>
      <Button className="mt-6" type="button" onClick={reset}>
        {messages.common.retry}
      </Button>
    </div>
  );
}
