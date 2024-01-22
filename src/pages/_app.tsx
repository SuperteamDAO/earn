// Styles
import 'degen/styles';
import '../styles/globals.scss';

import { ChakraProvider } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
// Fonts
import { Domine, Inter, JetBrains_Mono } from 'next/font/google';

import theme from '../config/chakra.config';
import { Wallet } from '../context/connectWalletContext';
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

function MyApp({ Component, pageProps }: AppProps) {
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
        <Wallet>
          <Component {...pageProps} />
        </Wallet>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
