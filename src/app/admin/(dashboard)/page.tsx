import { getMessages, categoryLabel } from '@/lib/i18n';
import { getAdminOverview } from '@/lib/queries/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminOverviewPage() {
  const [{ messages, locale }, stats] = await Promise.all([getMessages(), getAdminOverview()]);
  const maxTrend = Math.max(1, ...stats.trends.map((item) => item.count));
  const maxCat = Math.max(1, ...stats.categories.map((item) => item.count));

  const cards = [
    { label: messages.admin.pending, value: stats.pending },
    { label: messages.admin.needsReview, value: stats.needsReview },
    { label: messages.admin.answered, value: stats.answered },
    { label: messages.admin.published, value: stats.published },
    { label: messages.admin.rejectedCount, value: stats.rejected },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{messages.admin.overview}</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{card.value}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{messages.admin.trends}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-40 items-end gap-2">
          {stats.trends.map((item) => (
            <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-primary"
                style={{ height: `${(item.count / maxTrend) * 100}%` }}
                title={`${item.day}: ${item.count}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{messages.admin.topCategories}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{messages.admin.noData}</p>
          ) : (
            stats.categories.map((item) => (
              <div key={item.name_ar}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{categoryLabel(item, locale)}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(item.count / maxCat) * 100}%`, background: item.color }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
