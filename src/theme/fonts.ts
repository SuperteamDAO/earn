// importing localFont from a local file as Google imported fonts do not enable font-feature-settings. Reference: https://github.com/vercel/next.js/discussions/52456
import { Domine, Inter, JetBrains_Mono } from 'next/font/google';

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

export { fontMono, fontSans, fontSerif };
