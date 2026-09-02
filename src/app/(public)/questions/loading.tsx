import { getMessages } from '@/lib/i18n';
import { Skeleton } from '@/components/ui/skeleton';

export default async function Loading() {
  const { messages } = await getMessages();
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-12">
      <p className="sr-only">{messages.common.loading}</p>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
