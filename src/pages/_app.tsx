import '../styles/globals.scss';

import { ChakraProvider } from '@chakra-ui/react';
import { GoogleTagManager } from '@next/third-parties/google';
import { setUser } from '@sentry/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect } from 'react';
import { Toaster } from 'sonner';

import { FeatureModal } from '@/components/modals/FeatureModal';
import { SolanaWalletProvider } from '@/context/SolanaWallet';
import { useUser } from '@/store/user';
import { fontMono, fontSans, fontSerif } from '@/theme/fonts';

import theme from '../config/chakra.config';

// Chakra / Next/font don't play well in config.ts file for the theme. So we extend the theme here. (only the fonts)
const extendThemeWithNextFonts = {
  ...theme,
  fonts: {
    heading: fontSans.style.fontFamily,
    body: fontSans.style.fontFamily,
  },
};

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: any) {
  const router = useRouter();
  const { user, refetchUser } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    const handleRouteChange = () => posthog?.capture('$pageview');
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, posthog]);

  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  useEffect(() => {
    if (router.query.loginState === 'signedIn' && user) {
      posthog.identify(user.email);
      setUser({ id: user.id, email: user.email });
      const url = new URL(window.location.href);
      url.searchParams.delete('loginState');
      window.history.replaceState(null, '', url.href);
    }
  }, [router.query.loginState, user, posthog]);

  return (
    <>
      <NextTopLoader color="#6366F1" showSpinner={false} />
      <Component {...pageProps} key={router.asPath} />
      <Toaster position="bottom-center" richColors />
      <FeatureModal />
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
      <SolanaWalletProvider>
        <SessionProvider session={session}>
          <ChakraProvider theme={extendThemeWithNextFonts}>
            <MyApp Component={Component} pageProps={pageProps} />
          </ChakraProvider>
        </SessionProvider>
      </SolanaWalletProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
    </QueryClientProvider>
  );
}

export default App;
