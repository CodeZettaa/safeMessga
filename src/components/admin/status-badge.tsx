'use client';

import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/components/i18n-provider';

export function StatusBadge({ value }: { value: string }) {
  const { messages } = useI18n();
  const labels: Record<string, string> = {
    pending: messages.admin.pending,
    needs_review: messages.admin.needsReview,
    answered: messages.admin.answered,
    archived: messages.admin.archived,
    accepted: messages.admin.accepted,
    rejected: messages.admin.rejected,
    published: messages.admin.published,
    anonymous: messages.common.anonymous,
    identified: messages.admin.named,
  };

  const variant =
    value === 'needs_review' || value === 'rejected'
      ? 'destructive'
      : value === 'answered' || value === 'published' || value === 'accepted'
        ? 'secondary'
        : 'outline';

  return <Badge variant={variant}>{labels[value] ?? value}</Badge>;
}
