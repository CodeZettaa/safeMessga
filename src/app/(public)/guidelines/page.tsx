import type { Metadata } from 'next';
import { getMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();
  return { title: messages.meta.guidelinesTitle };
}

export default async function GuidelinesPage() {
  const { messages } = await getMessages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-9">
      <h1 className="text-3xl font-bold">{messages.guidelines.title}</h1>
      <p className="mt-6 text-muted-foreground">{messages.guidelines.intro}</p>
      <ul className="mt-6 list-disc space-y-3 ps-6">
        {messages.guidelines.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
