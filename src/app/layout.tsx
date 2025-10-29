import type { Metadata, Viewport } from 'next';

import Providers from '@/components/providers';
import { ProvidersApp } from '@/components/providers-app';
import { fontMono, fontSans } from '@/theme/fonts';

import '../styles/globals.css';

export const metadata: Metadata = {
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: 'light',
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${fontSans.variable} ${fontMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body>
        <Providers>
          <ProvidersApp>{children}</ProvidersApp>
        </Providers>
      </body>
    </html>
  );
}
