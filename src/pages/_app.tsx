import { GoogleTagManager } from '@next/third-parties/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { Router, useRouter } from 'next/router';
import { PagesTopLoader } from 'nextjs-toploader';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { useUser } from '@/store/user';
import { fontMono, fontSans } from '@/theme/fonts';
import { getURL } from '@/utils/validUrl';

import Providers from '@/features/privy/providers';

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

function MyApp({ Component, pageProps }: any) {
  const router = useRouter();
  const oldUrlRef = useRef('');
  const { user, isLoading: isUserLoading } = useUser();
  const forcedRedirected = useRef(false);

  useEffect(() => {
    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: `${getURL()}ingest`,
        ui_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
        },
      });
    }

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
      posthog.identify(user.email);
      const url = new URL(window.location.href);
      url.searchParams.delete('loginState');
      window.history.replaceState(null, '', url.href);
      forcedProfileRedirect(); // instantly when just signed in
    }
  }, [router, user, posthog, isUserLoading]);

  // forced profile redirection
  useEffect(() => {
    const loadRedirect = () => {
      if (!forcedRedirected.current) {
        forcedProfileRedirect(5000);
      }
    };
    loadRedirect();
  }, [user?.id]);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // SSR doesnt work with Solana Wallet Provider - hence need to wrap only when fully loaded
    // if SSR doesnt work, OG images also wont work
    setIsLoaded(true);
  }, []);

  const isDashboardRoute = useMemo(
    () => router.pathname.startsWith('/dashboard'),
    [router.pathname],
  );
  const walletListingRoute = useMemo(
    () => router.pathname.startsWith('/listing'),
    [router.pathname],
  );

  return (
    <>
      <PagesTopLoader color="#6366F1" showSpinner={false} />
      {isLoaded && (isDashboardRoute || walletListingRoute) ? (
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

function App({ Component, pageProps }: AppProps) {
  return (
    <PostHogProvider client={posthog}>
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
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
        </Providers>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </PostHogProvider>
  );
}

export default App;
