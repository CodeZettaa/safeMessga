'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { signOutAdmin } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { LocaleSwitcher } from '@/components/locale-switcher';

export function MobileNav({ items }: { items: Array<{ href: string; label: string }> }) {
  const [open, setOpen] = useState(false);
  const { locale, messages } = useI18n();

  return (
    <div className="flex items-center justify-between border-b bg-background p-3 md:hidden">
      <Button type="button" variant="outline" size="icon" onClick={() => setOpen(true)} aria-label={messages.common.menu}>
        <Menu />
      </Button>
      <span className="font-bold">{messages.admin.overview}</span>
      <LocaleSwitcher />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={locale === 'ar' ? 'right' : 'left'}>
          <nav className="mt-8 grid gap-3">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-2 py-2 hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <form action={signOutAdmin}>
              <Button type="submit" variant="secondary" className="w-full">
                {messages.admin.signOut}
              </Button>
            </form>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
