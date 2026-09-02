import type { Metadata } from 'next';
import { Cairo, Geist_Mono } from 'next/font/google';
import { siteConfig } from '@/lib/config';
import { getMessages, htmlLang } from '@/lib/i18n';
import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider } from '@/components/i18n-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: siteConfig.name,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.seo.defaultDescription,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.seo.defaultDescription,
    locale: 'en_US',
    alternateLocale: ['ar_EG'],
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages, dir } = await getMessages();

  return (
    <html
      lang={htmlLang(locale)}
      dir={dir}
      className={`${cairo.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <I18nProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-center" />
            </TooltipProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
