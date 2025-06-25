import { GoogleAnalytics } from '@next/third-parties/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { Router, useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { TopLoader } from '@/components/ui/toploader';
import { useUser } from '@/store/user';
import { fontMono, fontSans } from '@/theme/fonts';

import Providers from '@/features/privy/providers';

import '../styles/globals.css';
import '@/components/tiptap/styles/index.css';

const SolanaWalletProvider = dynamic(
  () =>
    import('@/context/SolanaWallet').then((mod) => mod.SolanaWalletProvider),
  { ssr: false },
);

const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster), {
  ssr: false,
});

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: any) {
  const router = useRouter();
  const oldUrlRef = useRef('');
  const { user, isLoading: isUserLoading } = useUser();
  const forcedRedirected = useRef(false);

  useEffect(() => {
    const handleRouteChange = () => posthog?.capture('$pageview');

    const handleRouteChangeStart = () =>
      posthog?.capture('$pageleave', {
        $current_url: oldUrlRef.current,
      });

    Router.events.on('routeChangeComplete', handleRouteChange);
    Router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange);
      Router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, []);

  const forcedProfileRedirect = useCallback(
    (wait?: number) => {
      if (
        router.pathname.startsWith('/new') ||
        router.pathname.startsWith('/sponsor') ||
        router.pathname.startsWith('/signup') ||
        !user
      )
        return;
      if (user.isTalentFilled || user.currentSponsorId) return;
      setTimeout(() => {
        if (wait) {
          toast.info('Finish your profile to continue browsing.', {
            description: `You will be redirected in ~${Math.floor(wait / 1000).toFixed(0)} seconds.`,
            duration: wait || 0,
          });
        }
        setTimeout(() => {
          router.push({
            pathname: '/new',
            query: {
              type: 'forced',
              originUrl: router.asPath,
            },
          });
        }, wait || 0);
      }, 0);
      forcedRedirected.current = true;
    },
    [user, router.pathname],
  );

  useEffect(() => {
    if (router.query.loginState === 'signedIn' && user && !isUserLoading) {
      if (user.isTalentFilled || !!user.currentSponsorId) {
        if (!posthog._isIdentified()) {
          posthog.identify(user.email);
        }
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('loginState');
      window.history.replaceState(null, '', url.href);
      forcedProfileRedirect(); // instantly when just signed in
    }
  }, [router, user, posthog, isUserLoading]);

  useEffect(() => {
    if (user?.id && !(user?.isTalentFilled || !!user?.currentSponsorId)) {
      if (posthog._isIdentified()) {
        posthog.reset();
      }
    }
  }, [user?.id]);

  useEffect(() => {
    const loadRedirect = () => {
      if (!forcedRedirected.current) {
        forcedProfileRedirect(5000);
      }
    };
    loadRedirect();
  }, [user?.id]);

  const isDashboardRoute = useMemo(
    () => router.pathname.startsWith('/dashboard'),
    [router.pathname],
  );

  return (
    <>
      <TopLoader />
      {isDashboardRoute ? (
        <SolanaWalletProvider>
          <Component {...pageProps} key={router.asPath} />
        </SolanaWalletProvider>
      ) : (
        <Component {...pageProps} key={router.asPath} />
      )}
      <Toaster position="bottom-right" richColors />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
    </>
  );
}

function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <style jsx global>{`
        :root {
          --font-sans: ${fontSans.style.fontFamily};
          --font-mono: ${fontMono.style.fontFamily};
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
      <Providers>
        <MyApp Component={Component} pageProps={pageProps} />
      </Providers>
    </QueryClientProvider>
  );
}

export default App;
