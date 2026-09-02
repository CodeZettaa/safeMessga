import Link from 'next/link';
import { LayoutDashboard, Inbox, Tags, Shield, LogOut } from 'lucide-react';
import { getMessages } from '@/lib/i18n';
import { siteConfig } from '@/lib/config';
import { signOutAdmin } from '@/app/actions/auth';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/admin/mobile-nav';
import { LocaleSwitcher } from '@/components/locale-switcher';

export async function AdminSidebar() {
  const { messages } = await getMessages();
  const items = [
    { href: '/admin', label: messages.admin.overview, icon: LayoutDashboard },
    { href: '/admin/inbox', label: messages.admin.inbox, icon: Inbox },
    { href: '/admin/categories', label: messages.admin.categories, icon: Tags },
    { href: '/admin/settings', label: messages.admin.settings, icon: Shield },
  ];

  return (
    <>
      <aside className="hidden w-64 shrink-0 bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="border-b border-sidebar-border p-5">
          <p className="font-bold">{siteConfig.name}</p>
          <p className="text-xs text-sidebar-foreground/70">{messages.admin.panelOf}</p>
          <div className="mt-3">
            <LocaleSwitcher />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-sidebar-accent"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAdmin} className="p-3">
          <button className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')} type="submit">
            <LogOut className="size-4" />
            {messages.admin.signOut}
          </button>
        </form>
      </aside>
      <MobileNav items={items.map(({ href, label }) => ({ href, label }))} />
    </>
  );
}
