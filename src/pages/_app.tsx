import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
// Styles
import 'degen/styles';
import '../styles/globals.scss';

import { ChakraProvider } from '@chakra-ui/react';
import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { AppProps } from 'next/app';
// Fonts
import { Domine, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { useEffect, useState } from 'react';

// import posthog from 'posthog-js';
// import { PostHogProvider } from 'posthog-js/react';
import theme from '../config/chakra.config';
import { Wallet } from '../context/connectWalletContext';

// importing localFont from a local file as Google imported fonts do not enable font-feature-settings. Reference: https://github.com/vercel/next.js/discussions/52456
const fontSans = localFont({
  src: [
    {
      path: '../../public/assets/fonts/inter/inter-subset.woff2',
      style: 'normal',
    },
    {
      path: '../../public/assets/fonts/inter/inter-subset.woff2',
      style: 'italic',
    },
  ],
  display: 'swap',
  preload: true,
  weight: '100 900',
  adjustFontFallback: 'Arial',
  declarations: [
    {
      prop: 'font-feature-settings',
      value:
        '"dlig", "liga", "calt", "tnum", "zero", "ss08", "cv10", "cv06", "cv08"',
    },
    {
      prop: 'unicode-range',
      value:
        'U+0020-007F, U+2000-206F, U+2070-209F, U+20A0-20CF, U+2100-214F, U+2200-22FF, U+FB00-FB4F, U+2190-21BB',
    },
    { prop: 'font-synthesis', value: 'none' },
  ],
});

const fontSerif = Domine({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  fallback: ['Times New Roman'],
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

// if (typeof window !== 'undefined') {
//   posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
//     api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
//     // eslint-disable-next-line @typescript-eslint/no-shadow
//     loaded: (posthog) => {
//       if (process.env.NODE_ENV === 'development') posthog.debug();
//     },
//   });
// }

function MyApp({ Component, pageProps }: AppProps) {
  const [isWalletLoaded, setIsWalletLoaded] = useState(false);

  useEffect(() => {
    setIsWalletLoaded(true);
  }, []);

  const queryClient = new QueryClient();

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
        {isWalletLoaded ? (
          <Wallet>
            <QueryClientProvider client={queryClient}>
              <Hydrate state={pageProps.dehydratedState}>
                <ReactQueryDevtools initialIsOpen={false} />
                <Component {...pageProps} />
              </Hydrate>
            </QueryClientProvider>
          </Wallet>
        ) : (
          <QueryClientProvider client={queryClient}>
            <Hydrate state={pageProps.dehydratedState}>
              <ReactQueryDevtools initialIsOpen={false} />
              <Component {...pageProps} />
            </Hydrate>
          </QueryClientProvider>
        )}
      </ChakraProvider>
    </>
  );
}

export default MyApp;
