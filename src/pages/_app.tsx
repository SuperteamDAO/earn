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
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

import { SolanaWalletProvider } from '@/context/SolanaWallet';
import { userStore } from '@/store/user';

import theme from '../config/chakra.config';
// importing localFont from a local file as Google imported fonts do not enable font-feature-settings. Reference: https://github.com/vercel/next.js/discussions/52456

const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  // fallback: ['Arial'],
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

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    // eslint-disable-next-line @typescript-eslint/no-shadow
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });
}

function MyApp({ Component, pageProps }: any) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setUserInfo, setIsLoggedIn } = userStore();

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

  return <Component {...pageProps} key={router.asPath} />;
}

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
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
      <ChakraProvider theme={extendThemeWithNextFonts}>
        <SessionProvider session={session}>
          <PostHogProvider client={posthog}>
            <SolanaWalletProvider>
              <MyApp Component={Component} pageProps={pageProps} />
            </SolanaWalletProvider>
          </PostHogProvider>
        </SessionProvider>
      </ChakraProvider>
    </>
  );
}

export default App;
