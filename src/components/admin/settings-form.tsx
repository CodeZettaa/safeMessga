'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { addBlockedTerm, deactivateBlockedTerm, updateSiteSettings } from '@/app/actions/admin';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SiteSettings } from '@/types/database';

export function ModerationSettingsForm({
  settings,
  terms,
  rejectionStats,
}: {
  settings: SiteSettings;
  terms: Array<{
    id: string;
    normalized_term: string;
    language: string;
    category: string;
    severity: number;
  }>;
  rejectionStats: { total: number; byReason: Array<{ reason: string; count: number }> };
}) {
  const { messages } = useI18n();
  const copy = messages.admin;
  const [form, setForm] = useState(settings);
  const [term, setTerm] = useState('');

  const numericFields: Array<[keyof SiteSettings, string]> = [
    ['rate_limit_window_seconds', copy.rateLimitWindow],
    ['rate_limit_max_submissions', copy.rateLimitMax],
    ['cooldown_seconds', copy.cooldown],
    ['risk_threshold_review', copy.reviewThreshold],
    ['risk_threshold_reject', copy.rejectThreshold],
    ['retention_days_private_contact', copy.retentionDays],
    ['blocked_attempts_threshold', copy.blockedAttempts],
    ['temp_block_minutes', copy.tempBlockMinutes],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="space-y-4 rounded-3xl border bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void updateSiteSettings({
            moderation_mode: form.moderation_mode,
            rate_limit_window_seconds: Number(form.rate_limit_window_seconds),
            rate_limit_max_submissions: Number(form.rate_limit_max_submissions),
            cooldown_seconds: Number(form.cooldown_seconds),
            risk_threshold_reject: Number(form.risk_threshold_reject),
            risk_threshold_review: Number(form.risk_threshold_review),
            retention_days_private_contact: Number(form.retention_days_private_contact),
            blocked_attempts_threshold: Number(form.blocked_attempts_threshold),
            temp_block_minutes: Number(form.temp_block_minutes),
          })
            .then(() => toast.success(copy.settingsSaved))
            .catch((error: unknown) => toast.error(error instanceof Error ? error.message : copy.actionError));
        }}
      >
        <h2 className="font-bold">{copy.moderationMode}</h2>
        <div className="space-y-2">
          <Label>{copy.mode}</Label>
          <select
            className="h-9 w-full rounded-lg border bg-background px-2 text-sm"
            value={form.moderation_mode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                moderation_mode: event.target.value as SiteSettings['moderation_mode'],
              }))
            }
          >
            <option value="balanced">{copy.balancedMode}</option>
            <option value="strict">{copy.strictMode}</option>
          </select>
        </div>
        {numericFields.map(([key, label]) => (
          <div key={key} className="space-y-2">
            <Label>{label}</Label>
            <Input
              type="number"
              step="any"
              value={form[key] as number}
              onChange={(event) => setForm((current) => ({ ...current, [key]: Number(event.target.value) }))}
            />
          </div>
        ))}
        <Button type="submit">{copy.saveSettings}</Button>
      </form>

      <div className="space-y-6">
        <section className="rounded-3xl border bg-card p-5">
          <h2 className="font-bold">{copy.customBlocked}</h2>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void addBlockedTerm({
                term,
                language: 'mixed',
                category: 'personal_attack',
                severity: 4,
              })
                .then(() => {
                  toast.success(copy.termAdded);
                  setTerm('');
                })
                .catch((error: unknown) => toast.error(error instanceof Error ? error.message : copy.actionError));
            }}
          >
            <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={copy.blockedPlaceholder} />
            <Button type="submit">{copy.add}</Button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {terms.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                <span>
                  {item.normalized_term} · {item.category}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => void deactivateBlockedTerm(item.id)}>
                  {copy.deactivate}
                </Button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border bg-card p-5">
          <h2 className="font-bold">{copy.rejectionStats}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy.rejectionTotal.replace('{count}', String(rejectionStats.total))}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {rejectionStats.byReason.map((item) => (
              <li key={item.reason} className="flex justify-between">
                <span>{item.reason}</span>
                <span>{item.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
