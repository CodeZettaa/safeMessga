import type { Metadata } from 'next';
import { getMessages } from '@/lib/i18n';
import { listActiveCategories } from '@/lib/queries/categories';
import { AskForm } from '@/components/ask/ask-form';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();
  return { title: messages.meta.askTitle };
}

export default async function AskPage() {
  const [{ messages }, categories] = await Promise.all([getMessages(), listActiveCategories()]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold md:text-4xl">{messages.ask.pageTitle}</h1>
      <p className="mt-3 leading-8 text-muted-foreground">{messages.ask.pageBody}</p>
      <div className="mt-8">
        <AskForm categories={categories} />
      </div>
    </div>
  );
}
