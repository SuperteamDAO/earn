import '@/styles/globals.css';
import '@/styles/st-globals.css';

import { GoogleAnalytics } from '@next/third-parties/google';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';

import { ExternalLinkDialogProvider } from '@/components/shared/ExternalLinkDialogProvider';
import { TokenListProvider } from '@/constants/tokenList';
import { SessionKeeper } from '@/lib/auth/session-keeper';
import { publicEnv } from '@/lib/public-env';
import { confirmDelay } from '@/lib/renewal';
import { getSession, getViewer, hasPrivySession } from '@/lib/session';
import { ViewerProvider } from '@/lib/viewer';
import { runtime } from '@/server/runtime';
import * as Tokens from '@/server/tokens';
import { fontVariables } from '@/theme/fonts';

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: 'Superteam Earn',
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#5522e0',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [session, viewer, privySession, now, tokens] = await Promise.all([
    getSession(),
    getViewer(),
    hasPrivySession(),
    runtime.runPromise(Clock.currentTimeMillis),
    // Without them the browser fetches the list itself.
    runtime.runPromise(
      Tokens.Tokens.use((service) => service.list).pipe(
        Effect.orElseSucceed(() => []),
      ),
    ),
  ]);
  return (
    <html lang="en" data-theme="light" className={fontVariables}>
      <body>
        <ViewerProvider viewer={viewer}>
          <TokenListProvider tokens={tokens}>
            <ExternalLinkDialogProvider>{children}</ExternalLinkDialogProvider>
          </TokenListProvider>
        </ViewerProvider>
        <Toaster position="bottom-right" richColors />
        {/* By the server's clock; a reissued session starts it over. Without
            Privy's cookie (gone, or held back on a link from another site)
            Privy has nothing to vouch with, so the session just stands. */}
        <SessionKeeper
          key={session?.confirmedAt ?? 0}
          confirmIn={
            session && privySession
              ? confirmDelay(session.confirmedAt, now)
              : null
          }
        />
        {publicEnv.gaTrackingId && (
          <GoogleAnalytics gaId={publicEnv.gaTrackingId} />
        )}
      </body>
    </html>
  );
}
