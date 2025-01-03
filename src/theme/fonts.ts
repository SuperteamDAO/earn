import { Inter, JetBrains_Mono } from 'next/font/google';

const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
  fallback: ['Inter'],
  style: ['normal', 'italic'],
  weight: 'variable',
  variable: '--font-sans',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  preload: false,
  fallback: ['Courier New'],
  style: ['normal', 'italic'],
  weight: 'variable',
  variable: '--font-mono',
});

export { fontMono, fontSans };
