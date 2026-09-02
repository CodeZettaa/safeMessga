import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { getMessages } from '@/lib/i18n';
import { AdminSidebar } from '@/components/admin/sidebar';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdmin();
  if (!auth.ok && auth.status === 401) {
    redirect('/admin/login');
  }

  if (!auth.ok) {
    const { messages } = await getMessages();
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 text-center">
        <h1 className="text-2xl font-bold">{messages.admin.unauthorized}</h1>
        <p className="mt-3 text-muted-foreground">{messages.admin.unauthorizedBody}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
