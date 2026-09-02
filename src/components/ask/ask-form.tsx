'use client';

import { useState } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/lib/config';
import { categoryLabel } from '@/lib/i18n/locale';
import { submitQuestion } from '@/app/actions/submit-question';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Category } from '@/types/database';

export function AskForm({
  categories,
  databaseReady = true,
}: {
  categories: Category[];
  databaseReady?: boolean;
}) {
  const { locale, messages } = useI18n();
  const [started, setStarted] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [showName, setShowName] = useState(false);
  const [website, setWebsite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const charCount = message.length;
  const selectedCategory = Boolean(categoryId);

  function resetForm() {
    setStarted(false);
    setCategoryId('');
    setMessage('');
    setName('');
    setShowName(false);
    setError(null);
    setSent(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!categoryId) {
      setError(messages.ask.chooseCategory);
      return;
    }

    if (message.trim().length < siteConfig.limits.minMessageLength) {
      setError(messages.ask.messageTooShort);
      return;
    }

    if (showName && name.trim().length < 2) {
      setError(messages.ask.nameRequired);
      return;
    }

    setPending(true);
    const identified = showName && name.trim().length >= 2;
    const result = await submitQuestion({
      categoryId,
      message,
      identityMode: identified ? 'identified' : 'anonymous',
      senderDisplayName: identified ? name.trim() : undefined,
      website,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-3xl border bg-card p-8 text-center shadow-sm">
        <h2 className="text-2xl font-bold">{messages.ask.successTitle}</h2>
        <p className="mt-3 leading-8 text-muted-foreground">{messages.ask.successBody}</p>
        <Button type="button" className="mt-6" onClick={resetForm}>
          {messages.ask.sendAnother}
        </Button>
      </div>
    );
  }

  if (!started) {
    return (
      <Button type="button" size="lg" className="h-12 w-full px-6 sm:w-auto" onClick={() => setStarted(true)}>
        {messages.home.primaryCta}
      </Button>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">
        {databaseReady ? messages.ask.noCategories : messages.ask.databaseUnavailable}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border bg-card p-5 shadow-sm md:p-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="category">{messages.ask.chooseCategory}</Label>
        <select
          id="category"
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">{messages.ask.categoryPlaceholder}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {categoryLabel(category, locale)}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="message">{messages.ask.messageLabel}</Label>
            <Textarea
              id="message"
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={messages.ask.messagePlaceholder}
              maxLength={siteConfig.limits.maxMessageLength}
            />
            <p className="text-xs text-muted-foreground">
              {charCount} / {siteConfig.limits.maxMessageLength} {messages.ask.charCount}
            </p>
          </div>

          {showName ? (
            <div className="space-y-2">
              <Label htmlFor="senderDisplayName">{messages.ask.displayName}</Label>
              <Input
                id="senderDisplayName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={siteConfig.limits.maxDisplayNameLength}
                autoComplete="nickname"
              />
              <p className="text-xs leading-6 text-muted-foreground">{messages.ask.addNameHint}</p>
            </div>
          ) : null}

          <div className="hidden" aria-hidden="true">
            <Input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => setShowName((current) => !current)}
            >
              {showName ? messages.ask.hideName : messages.ask.addName}
            </button>
            <Button type="submit" size="lg" className="h-11 px-6" disabled={pending}>
              {pending ? messages.common.loading : messages.ask.submit}
            </Button>
          </div>

          <p className="text-xs leading-6 text-muted-foreground">
            {messages.ask.privacyNote}{' '}
            <Link href="/guidelines" className="underline underline-offset-4">
              {messages.nav.guidelines}
            </Link>
            .
          </p>
        </>
      ) : null}
    </form>
  );
}
