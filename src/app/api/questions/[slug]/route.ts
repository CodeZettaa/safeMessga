import { NextResponse } from 'next/server';
import { getPublishedQuestion } from '@/lib/queries/public-questions';
import { assertNoPrivateLeak } from '@/lib/validation/publishing';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const question = await getPublishedQuestion(slug);
  if (!question) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  assertNoPrivateLeak(question);
  return NextResponse.json(question);
}
