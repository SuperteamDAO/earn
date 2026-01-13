import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html data-theme="light" lang="en">
      <Head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="manifest" href="/earn/site.webmanifest" />
        <link rel="apple-touch-icon" href="/earn/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/earn/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/earn/favicon-16x16.png"
        />
        <link rel="icon" href="/earn/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
