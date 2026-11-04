import '../styles/globals.css';
import '../styles/st-globals.css';

import { GoogleAnalytics } from '@next/third-parties/google';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import type { ReactElement, ReactNode } from 'react';

import Providers from '@/components/providers';
import { TokenListProvider } from '@/constants/tokenList';
import { fontVariables } from '@/theme/fonts';

const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster), {
  ssr: false,
});

const TopLoader = dynamic(
  () => import('@/components/ui/toploader').then((mod) => mod.TopLoader),
  { ssr: false },
);

type AppPropsWithLayout = AppProps & {
  Component: NextPage & {
    getLayout?: (page: ReactElement) => ReactNode;
  };
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();
  // Remount on path changes (e.g. /listing/a -> /listing/b) but not on
  // query/hash changes, so shallow filter updates keep page state.
  const pageKey = router.asPath.split(/[?#]/)[0];

  if (Component.getLayout) {
    return (
      <TokenListProvider>
        {Component.getLayout(<Component {...pageProps} key={pageKey} />)}
      </TokenListProvider>
    );
  }

  return (
    <TokenListProvider>
      <div className={fontVariables}>
        <Providers>
          <TopLoader />
          <Component {...pageProps} key={pageKey} />
          <Toaster position="bottom-right" richColors />
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
        </Providers>
      </div>
    </TokenListProvider>
  );
}

export default App;
