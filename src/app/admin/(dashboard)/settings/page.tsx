import { getMessages } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/queries/settings';
import { getRejectionStats, listBlockedTerms } from '@/lib/queries/admin';
import { ModerationSettingsForm } from '@/components/admin/settings-form';

export default async function SettingsPage() {
  const [{ messages }, settings, terms, rejectionStats] = await Promise.all([
    getMessages(),
    getSiteSettings(),
    listBlockedTerms(),
    getRejectionStats(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{messages.admin.settings}</h1>
      <ModerationSettingsForm settings={settings} terms={terms} rejectionStats={rejectionStats} />
    </div>
  );
}
