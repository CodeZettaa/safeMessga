import { NextResponse } from 'next/server';
import { listPublishedQuestions } from '@/lib/queries/public-questions';
import { assertNoPrivateLeak } from '@/lib/validation/publishing';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await listPublishedQuestions({
    search: searchParams.get('q') ?? undefined,
    categoryKey: searchParams.get('category') ?? undefined,
    page: Number(searchParams.get('page') ?? '1') || 1,
  });

  assertNoPrivateLeak(result.items);
  return NextResponse.json(result);
}
