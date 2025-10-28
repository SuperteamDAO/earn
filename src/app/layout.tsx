import type { Metadata, Viewport } from 'next';

import Providers from '@/components/providers';
import { fontMono, fontSans } from '@/theme/fonts';

import { ClientProviders } from './client-providers';

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
          <ClientProviders>{children}</ClientProviders>
        </Providers>
      </body>
    </html>
  );
}
