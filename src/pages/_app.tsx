import { GoogleAnalytics } from '@next/third-parties/google';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import Providers from '@/components/providers';
import { fontVariables } from '@/theme/fonts';

import '../styles/globals.css';

const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster), {
  ssr: false,
});

const TopLoader = dynamic(
  () => import('@/components/ui/toploader').then((mod) => mod.TopLoader),
  { ssr: false },
);

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <div className={fontVariables}>
      <Providers>
        <TopLoader />
        <Component {...pageProps} key={router.asPath} />
        <Toaster position="bottom-right" richColors />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
      </Providers>
    </div>
  );
}

export default App;
