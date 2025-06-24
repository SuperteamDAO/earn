import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import React, { useEffect, useMemo } from 'react';

import { TopLoader } from '@/components/ui/toploader';
import { fontMono, fontSans } from '@/theme/fonts';

import '../styles/globals.css';
import '@/components/tiptap/styles/index.css';

// Progressive loading of heavy components
const PostHogProvider = dynamic(
  () => import('posthog-js/react').then((mod) => mod.PostHogProvider),
  { ssr: false },
);

const QueryClientProvider = dynamic(
  () => import('@tanstack/react-query').then((mod) => mod.QueryClientProvider),
  { ssr: false },
);

const Providers = dynamic(() => import('@/features/privy/providers'), {
  ssr: false,
});

const SolanaWalletProvider = dynamic(
  () =>
    import('@/context/SolanaWallet').then((mod) => mod.SolanaWalletProvider),
  { ssr: false },
);

const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster), {
  ssr: false,
});

// Analytics and tracking - load after critical content
const GoogleAnalytics = dynamic(
  () => import('@next/third-parties/google').then((mod) => mod.GoogleAnalytics),
  { ssr: false },
);

const PostHogInit = dynamic(
  () => import('../components/analytics/PostHogInit'),
  {
    ssr: false,
  },
);

const UserProfileManager = dynamic(
  () => import('../components/auth/UserProfileManager'),
  { ssr: false },
);

// Lazy-loaded query client
const createQueryClient = () => {
  if (typeof window === 'undefined') return null;

  const { QueryClient } = require('@tanstack/react-query');
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  });
};

function MyApp({ Component, pageProps }: AppProps) {
  const queryClient = useMemo(() => createQueryClient(), []);

  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Preload commonly used modules
          import('@/store/user');
          import('posthog-js');
        });
      }
    };

    preloadCriticalResources();
  }, []);

  const isDashboardRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith('/dashboard');
  }, []);

  // Early return for server-side rendering
  if (typeof window === 'undefined') {
    return <Component {...pageProps} />;
  }

  return (
    <>
      <TopLoader />
      {isDashboardRoute ? (
        <SolanaWalletProvider>
          <Component {...pageProps} />
        </SolanaWalletProvider>
      ) : (
        <Component {...pageProps} />
      )}
      <Toaster position="bottom-right" richColors />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
    </>
  );
}

function App({ Component, pageProps }: AppProps) {
  const queryClient = useMemo(() => createQueryClient(), []);

  // Early return for server-side rendering with minimal styles
  if (typeof window === 'undefined') {
    return (
      <>
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
        <Component {...pageProps} />
      </>
    );
  }

  return (
    <>
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

      <React.Suspense fallback={<TopLoader />}>
        <PostHogProvider client={null}>
          <QueryClientProvider client={queryClient}>
            <Providers>
              <PostHogInit />
              <UserProfileManager />
              <MyApp Component={Component} pageProps={pageProps} />
            </Providers>
          </QueryClientProvider>
        </PostHogProvider>
      </React.Suspense>
    </>
  );
}

export default App;
