import { Head, Html, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
          }}
        />
        <Script
          id="posthog-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
      if (typeof window !== 'undefined' && !window.location.host.includes('127.0.0.1') && !window.location.host.includes('localhost')) {
        posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}', { api_host: '${process.env.NEXT_PUBLIC_POSTHOG_HOST}' });
        console.log('Posthog initialized');
      }
    `,
          }}
        />
      </body>
    </Html>
  );
}
