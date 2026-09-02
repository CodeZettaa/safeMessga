'use client';

import { en } from '@/lib/i18n/en';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="grid min-h-screen place-items-center p-6 font-sans">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{en.common.error}</h1>
          <button type="button" className="mt-6 underline" onClick={reset}>
            {en.common.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
