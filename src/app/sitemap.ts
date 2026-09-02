import type { MetadataRoute } from 'next';
import { getPublicEnv } from '@/lib/env';
import { listSitemapQuestions } from '@/lib/queries/public-questions';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicEnv().siteUrl;
  const questions = await listSitemapQuestions();

  return [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/ask`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/questions`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/guidelines`, changeFrequency: 'yearly', priority: 0.3 },
    ...questions.map((question) => ({
      url: `${siteUrl}/questions/${question.slug}`,
      lastModified: question.published_at,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
