import { GoogleAnalytics } from '@next/third-parties/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useEffect } from 'react';

import { useForcedProfileRedirect } from '@/hooks/use-forced-profile-redirect';
import { useUser } from '@/store/user';
import { fontMono, fontSans } from '@/theme/fonts';

import Providers from '@/features/privy/providers';

import '../styles/globals.css';
import '@/components/tiptap/styles/index.css';

const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster), {
  ssr: false,
});

const TopLoader = dynamic(
  () => import('@/components/ui/toploader').then((mod) => mod.TopLoader),
  { ssr: false },
);

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: any) {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();

  useForcedProfileRedirect({ user, isUserLoading });

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      if (posthog._isIdentified()) posthog.reset();
      return;
    }

    const profileComplete = user.isTalentFilled || !!user.currentSponsorId;

    if (profileComplete) {
      const alreadyIdentified = posthog._isIdentified();
      const sameUser = posthog.get_distinct_id() === String(user.id);

      if (!alreadyIdentified || !sameUser) {
        posthog.identify(user.id, { email: user.email });
      }
    }
  }, [user?.id, isUserLoading]);

  return (
    <>
      <TopLoader />
      <Component {...pageProps} key={router.asPath} />
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
      `}</style>
      <Providers>
        <MyApp Component={Component} pageProps={pageProps} />
      </Providers>
    </QueryClientProvider>
  );
}

export default App;
