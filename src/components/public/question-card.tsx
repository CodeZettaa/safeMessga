import Link from 'next/link';
import { CategoryIcon } from '@/lib/icons';
import { formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PublicQuestionDto } from '@/lib/validation/publishing';
import type { Messages } from '@/lib/i18n/ar';
import type { Locale } from '@/lib/i18n/locale';
import { localizedAnonymousName, categoryLabel } from '@/lib/i18n/locale';

export function QuestionCard({
  question,
  messages,
  locale,
}: {
  question: PublicQuestionDto;
  messages: Messages;
  locale: Locale;
}) {
  return (
    <Link href={`/questions/${question.slug}`} className="block h-full">
      <Card className="h-full transition-transform hover:-translate-y-0.5">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary" className="gap-1">
              <CategoryIcon name={question.category.icon} className="size-3.5" />
              {categoryLabel(
                { name_ar: question.category.nameAr, name_en: question.category.nameEn },
                locale,
              )}
            </Badge>
            {question.isPinned ? <Badge>{messages.questions.pinned}</Badge> : null}
          </div>
          <CardTitle className="text-lg leading-8">{question.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">
          <p className="line-clamp-3">{question.questionBody}</p>
          <p className="mt-4 text-xs">
            {localizedAnonymousName(question.displayName, messages)} · {formatDate(question.publishedAt, locale)}{' '}
            · {question.viewCount} {messages.questions.views}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
