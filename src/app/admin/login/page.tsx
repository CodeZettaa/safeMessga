import { getMessages } from '@/lib/i18n';
import { signInAdmin } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isSupabaseConfigured } from '@/lib/env';
import { LocaleSwitcher } from '@/components/locale-switcher';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const { messages } = await getMessages();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="mb-6">
        <LocaleSwitcher />
      </div>
      <h1 className="text-3xl font-bold">{messages.admin.loginTitle}</h1>
      <p className="mt-2 text-muted-foreground">{messages.admin.loginBody}</p>
      {!configured ? (
        <p className="mt-6 rounded-2xl border border-dashed p-4 text-sm">
          {messages.admin.loginUnavailable}
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-4 text-sm text-destructive">{messages.admin.loginInvalid}</p>
      ) : null}
      <form action={signInAdmin} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={params.next ?? '/admin'} />
        <div className="space-y-2">
          <Label htmlFor="email">{messages.admin.email}</Label>
          <Input id="email" name="email" type="email" required autoComplete="username" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{messages.admin.password}</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full" disabled={!configured}>
          {messages.admin.signIn}
        </Button>
      </form>
    </div>
  );
}
