import Link from 'next/link';
import { siteConfig } from '@/lib/config';
import { getMessages } from '@/lib/i18n';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export async function SiteHeader() {
  const { messages, locale } = await getMessages();
  const brandName = locale === 'en' ? siteConfig.name : siteConfig.nameAr;
  const links = [
    { href: '/', label: messages.nav.home },
    { href: '/questions', label: messages.nav.questions },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-sm text-primary-foreground">
            {locale === 'en' ? siteConfig.ownerName.slice(0, 1) : siteConfig.ownerNameAr.slice(0, 1)}
          </span>
          <span>
            {brandName}
            <span className="block text-[11px] font-medium text-muted-foreground">
              {siteConfig.brand}
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label={messages.nav.mainAria}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link href="/#ask" className={cn(buttonVariants({ size: 'sm' }), 'h-8 px-3')}>
            {messages.nav.ask}
          </Link>
        </div>
      </div>
    </header>
  );
}
