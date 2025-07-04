import { GoogleAnalytics } from '@next/third-parties/google';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import Providers from '@/components/providers';

import '../styles/globals.css';
import '@/components/tiptap/styles/index.css';

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
    <Providers>
      <TopLoader />
      <Component {...pageProps} key={router.asPath} />
      <Toaster position="bottom-right" richColors />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
    </Providers>
  );
}

export default App;
