import type { Metadata } from 'next';
import { getMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();
  return { title: messages.meta.privacyTitle };
}

export default async function PrivacyPage() {
  const { messages } = await getMessages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-9">
      <h1 className="text-3xl font-bold">{messages.privacy.title}</h1>
      <p className="mt-6 text-muted-foreground">{messages.privacy.intro}</p>
      <h2 className="mt-8 text-xl font-bold">{messages.privacy.collectTitle}</h2>
      <ul className="mt-3 list-disc space-y-2 ps-6">
        {messages.privacy.collectItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-bold">{messages.privacy.skipTitle}</h2>
      <ul className="mt-3 list-disc space-y-2 ps-6">
        {messages.privacy.skipItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-bold">{messages.privacy.retentionTitle}</h2>
      <p className="mt-3">{messages.privacy.retentionBody}</p>
    </div>
  );
}
