// Styles
import 'degen/styles';
import '../styles/globals.scss';

import { ChakraProvider } from '@chakra-ui/react';
import axios from 'axios';
import type { AppProps } from 'next/app';
// Fonts
import { Domine, Inter, JetBrains_Mono } from 'next/font/google';
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
import { getURL } from '@/utils/validUrl';

import theme from '../config/chakra.config';

// importing localFont from a local file as Google imported fonts do not enable font-feature-settings. Reference: https://github.com/vercel/next.js/discussions/52456

const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  fallback: ['Inter'],
  weight: 'variable',
});

const fontSerif = Domine({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  // fallback: ['Times New Roman'],
  weight: 'variable',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: false,
  fallback: ['Courier New'],
  weight: 'variable',
});

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
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [latestActiveSlug, setLatestActiveSlug] = useState<string | undefined>(
    undefined,
  );
  const { userInfo, setUserInfo } = userStore();
  const router = useRouter();

  const handleFeatureClose = () => {
    setIsFeatureModalOpen(false);
  };

  const handleTOSClose = async () => {
    console.log('closee');
    setIsTOSModalOpen(false);
    localStorage.setItem('acceptedTOS', JSON.stringify(true));
    console.log('userINFOOOO - ', userInfo);
    if (userInfo) {
      setUserInfo({ ...userInfo, acceptedTOS: true });
      await axios.post('/api/user/update/', {
        acceptedTOS: true,
      });
    }
  };

  const getSponsorLatestActiveSlug = async () => {
    try {
      const slug = await axios.get('/api/bounties/latestActiveSlug');
      if (slug.data) {
        setLatestActiveSlug(slug.data.slug);
      }
    } catch (e) {
      console.log(e);
    }
  };

  // SHOW TO SPONSOR ONLY
  useEffect(() => {
    const updateFeatureModalShown = async () => {
      if (userInfo?.featureModalShown === false && userInfo?.currentSponsorId) {
        setUserInfo({ ...userInfo, featureModalShown: true });
        setIsFeatureModalOpen(true);
        await getSponsorLatestActiveSlug();
        await axios.post('/api/user/update/', {
          featureModalShown: true,
        });
      }
    };

    if (!router.pathname.includes('dashboard')) updateFeatureModalShown();
  }, [userInfo]);

  useEffect(() => {
    console.log('userInfooo - ', userInfo);
    setIsTOSModalOpen(false);
    const shown =
      (JSON.parse(localStorage.getItem('acceptedTOS') ?? 'false') as boolean) ??
      false;
    if (userInfo) {
      if (!userInfo.acceptedTOS) {
        if (shown) {
          setUserInfo({ ...userInfo, acceptedTOS: true });
          axios.post('/api/user/update/', {
            acceptedTOS: true,
          });
        } else {
          setIsTOSModalOpen(true);
        }
      } else {
        localStorage.setItem('acceptedTOS', JSON.stringify(true));
      }
    } else {
      if (!shown) setIsTOSModalOpen(true);
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
              <TermsOfServices
                isOpen={isTOSModalOpen}
                onClose={handleTOSClose}
              />
              <MyApp Component={Component} pageProps={pageProps} />
            </ChakraProvider>
          </SessionProvider>
        </PostHogProvider>
      </SolanaWalletProvider>
    </>
  );
}

export default App;
