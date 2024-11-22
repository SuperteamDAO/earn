import '../styles/globals.scss';

import { ChakraProvider } from '@chakra-ui/react';
import { GoogleTagManager } from '@next/third-parties/google';
import { setUser } from '@sentry/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import { PagesTopLoader } from 'nextjs-toploader';
import posthog from 'posthog-js';
import { PostHogProvider, usePostHog } from 'posthog-js/react';
import React, { useEffect } from 'react';

import { useUser } from '@/store/user';
import { fontMono, fontSans, fontSerif } from '@/theme/fonts';
import { getURL } from '@/utils/validUrl';

import theme from '../config/chakra.config';

// Chakra / Next/font don't play well in config.ts file for the theme. So we extend the theme here. (only the fonts)
const extendThemeWithNextFonts = {
  ...theme,
  fonts: {
    heading: fontSans.style.fontFamily,
    body: fontSans.style.fontFamily,
  },
};

const SolanaWalletProvider = dynamic(
  () =>
    import('@/context/SolanaWallet').then((mod) => mod.SolanaWalletProvider),
  { ssr: false },
);

const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster), {
  ssr: false,
});

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then(
      (mod) => mod.ReactQueryDevtools,
    ),
  { ssr: false },
);

const queryClient = new QueryClient();

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: `${getURL()}ingest`,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });
}

function MyApp({ Component, pageProps }: any) {
  const router = useRouter();
  const { user } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    const handleRouteChange = () => posthog?.capture('$pageview');
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, posthog]);

  useEffect(() => {
    if (router.query.loginState === 'signedIn' && user) {
      posthog.identify(user.email);
      setUser({ id: user.id, email: user.email });
      const url = new URL(window.location.href);
      url.searchParams.delete('loginState');
      window.history.replaceState(null, '', url.href);
    }
  }, [router.query.loginState, user, posthog]);

  const isDashboardRoute = router.pathname.startsWith('/dashboard');

  return (
    <>
      <PagesTopLoader color="#6366F1" showSpinner={false} />
      {isDashboardRoute ? (
        <SolanaWalletProvider>
          <Component {...pageProps} key={router.asPath} />
        </SolanaWalletProvider>
      ) : (
        <Component {...pageProps} key={router.asPath} />
      )}
      <Toaster position="bottom-right" richColors />
    </>
  );
}

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <style jsx global>{`
        :root {
          --font-sans: ${fontSans.style.fontFamily};
          --font-serif: ${fontSerif.style.fontFamily};
          --font-mono: ${fontMono.style.fontFamily};
        }
      `}</style>
      <PostHogProvider client={posthog}>
        <SessionProvider session={session}>
          <ChakraProvider theme={extendThemeWithNextFonts}>
            <MyApp Component={Component} pageProps={pageProps} />
          </ChakraProvider>
        </SessionProvider>
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
      </PostHogProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
