import { GoogleTagManager } from '@next/third-parties/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import { PagesTopLoader } from 'nextjs-toploader';
import posthog from 'posthog-js';
import { PostHogProvider, usePostHog } from 'posthog-js/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useUser } from '@/store/user';
import { fontMono, fontSans } from '@/theme/fonts';
import { getURL } from '@/utils/validUrl';

import '../styles/globals.scss';
import '@/components/tiptap/styles/index.css';

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
  const forcedRedirected = useRef(false);

  useEffect(() => {
    const handleRouteChange = () => posthog?.capture('$pageview');
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, posthog]);

  const forcedProfileRedirect = useCallback(
    (wait?: number) => {
      if (
        router.pathname.startsWith('/new') ||
        router.pathname.startsWith('/sponsor') ||
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
    if (router.query.loginState === 'signedIn' && user) {
      posthog.identify(user.email);
      const url = new URL(window.location.href);
      url.searchParams.delete('loginState');
      window.history.replaceState(null, '', url.href);
      forcedProfileRedirect(); // instantly when just signed in
    }
  }, [router.query.loginState, user, posthog]);

  // forced profile redirection
  useEffect(() => {
    const handleRouteComplete = () => {
      if (!forcedRedirected.current) {
        forcedProfileRedirect(5000);
      }
    };
    handleRouteComplete();
  }, [user?.id]);

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
          --font-mono: ${fontMono.style.fontFamily};
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
      <PostHogProvider client={posthog}>
        <SessionProvider session={session}>
          <MyApp Component={Component} pageProps={pageProps} />
        </SessionProvider>
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
      </PostHogProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
