import { Head, Html, Main, NextScript } from 'next/document';

import { fontVariables } from '@/theme/fonts';

export default function Document() {
  return (
    <Html data-theme="light" lang="en" className={fontVariables}>
      <Head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
