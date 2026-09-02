import Link from 'next/link';
import { siteConfig } from '@/lib/config';
import { getMessages } from '@/lib/i18n';

export async function SiteFooter() {
  const { messages, locale } = await getMessages();
  const brandName = locale === 'en' ? siteConfig.name : siteConfig.nameAr;

  return (
    <footer className="mt-auto border-t border-border/70 bg-card/70">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-bold">{brandName}</p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">{messages.footer.blurb}</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">{messages.footer.links}</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/privacy">{messages.nav.privacy}</Link>
            </li>
            <li>
              <Link href="/guidelines">{messages.nav.guidelines}</Link>
            </li>
            <li>
              <Link href="/questions">{messages.nav.questions}</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">{messages.footer.social}</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <a href={siteConfig.social.linkedin} rel="noreferrer" target="_blank">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={siteConfig.social.youtube} rel="noreferrer" target="_blank">
                YouTube
              </a>
            </li>
            <li>
              <a href={siteConfig.social.instagram} rel="noreferrer" target="_blank">
                Instagram
              </a>
            </li>
            <li>
              <a href={siteConfig.social.x} rel="noreferrer" target="_blank">
                X
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        {messages.footer.by}
      </div>
    </footer>
  );
}
