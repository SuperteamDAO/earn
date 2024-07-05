import 'degen/styles';
import '../styles/globals.scss';

import { ChakraProvider } from '@chakra-ui/react';
import axios from 'axios';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { SessionProvider, useSession } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import posthog from 'posthog-js';
import { PostHogProvider, usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { FeatureModal } from '@/components/modals/FeatureModal';
import { TermsOfServices } from '@/components/modals/TermsOfServices';
import { SolanaWalletProvider } from '@/context/SolanaWallet';
import { userStore } from '@/store/user';
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

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    debug: false,
    api_host: `${getURL()}ingest`,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  });
  posthog.debug(false);
}

function MyApp({ Component, pageProps }: any) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setUserInfo, setIsLoggedIn } = userStore();

  const posthog = usePostHog();

  useEffect(() => {
    const handleRouteChange = () => posthog?.capture('$pageview');
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  const newLoginState = router.query.loginState;
  if (newLoginState == 'signedIn' && session) {
    posthog.identify(session.user.email);
    const url = new URL(window.location.href);
    url.searchParams.delete('loginState');
    window.history.replaceState(null, '', url.href);
  }

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (status === 'authenticated') {
        try {
          const res = await axios.get('/api/user');
          setIsLoggedIn(true);
          setUserInfo(res.data);
        } catch (error) {
          console.log('Failed to fetch user info:', error);
        }
      }
    };

    fetchUserInfo();
  }, [session, status]);

  return (
    <>
      <NextTopLoader color={'#6366F1'} showSpinner={false} />
      <Component {...pageProps} key={router.asPath} />
      <Toaster position="bottom-center" />
    </>
  );
}

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [latestActiveSlug, setLatestActiveSlug] = useState<string | undefined>(
    undefined,
  );
  const { userInfo, setUserInfo } = userStore();
  const router = useRouter();

  const handleFeatureClose = () => {
    setIsFeatureModalOpen(false);
  };

  const getSponsorLatestActiveSlug = async () => {
    try {
      const slug = await axios.get('/api/listings/latest-active-slug');
      if (slug.data) {
        setLatestActiveSlug(slug.data.slug);
      }
    } catch (e) {
      console.log(e);
    }
  };

  // FEATURE MODAL SPONSOR ONLY
  useEffect(() => {
    try {
      const updateFeatureModalShown = async () => {
        if (
          userInfo?.featureModalShown === false &&
          userInfo?.currentSponsorId
        ) {
          setUserInfo({ ...userInfo, featureModalShown: true });
          setIsFeatureModalOpen(true);
          await getSponsorLatestActiveSlug();
          await axios.post('/api/user/update/', {
            featureModalShown: true,
          });
        }
      };
      if (!router.pathname.includes('dashboard')) updateFeatureModalShown();
    } catch (e) {
      console.log('unable to get current user feature modal state', e);
    }
  }, [userInfo]);

  return (
    <>
      <style jsx global>
        {`
          :root {
            --font-sans: ${fontSans.style.fontFamily};
            --font-serif: ${fontSerif.style.fontFamily};
            --font-mono: ${fontMono.style.fontFamily};
          }
        `}
      </style>
      <SolanaWalletProvider>
        <PostHogProvider client={posthog}>
          <SessionProvider session={session}>
            <ChakraProvider theme={extendThemeWithNextFonts}>
              <FeatureModal
                latestActiveBountySlug={latestActiveSlug}
                isOpen={isFeatureModalOpen}
                onClose={handleFeatureClose}
              />
              <MyApp Component={Component} pageProps={pageProps} />
              <TermsOfServices />
            </ChakraProvider>
          </SessionProvider>
        </PostHogProvider>
      </SolanaWalletProvider>
    </>
  );
}

export default App;
