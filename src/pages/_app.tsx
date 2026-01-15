import { GoogleAnalytics } from '@next/third-parties/google';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Providers from '@/components/providers';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { fontVariables } from '@/theme/fonts';
import { stFontVariables } from '@/theme/fonts-st';

import Footer from '@/features/stfun/components/common/Footer';
import Header from '@/features/stfun/components/common/Header';

import '../styles/globals.css';
import '../styles/st-globals.css';

const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster), {
  ssr: false,
});

const TopLoader = dynamic(
  () => import('@/components/ui/toploader').then((mod) => mod.TopLoader),
  { ssr: false },
);

// ST routes that should render with the dark theme and ST layout
const ST_ROUTES = [
  '/',
  '/collaborate',
  '/fast-track',
  '/member-perks',
  '/projects',
];

function isSTRoute(pathname: string): boolean {
  return ST_ROUTES.includes(pathname);
}

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isST = isSTRoute(router.pathname);

  // Register GSAP plugins for ST pages
  useEffect(() => {
    if (!isST || typeof window === 'undefined') {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Image loading handler for ST pages
    const handleImageLoad = (img: HTMLImageElement) => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'), {
          once: true,
        });
      }
    };

    document.querySelectorAll('img').forEach((img) => handleImageLoad(img));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            handleImageLoad(node);
          }
          if (node instanceof HTMLElement) {
            node.querySelectorAll('img').forEach((img) => handleImageLoad(img));
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [isST]);

  // ST layout (dark theme, ST Header/Footer)
  if (isST) {
    return (
      <div className={`${stFontVariables} st-app flex min-h-screen flex-col`}>
        <Header className="mx-auto px-10 md:px-[72px]" />
        <div className="relative mx-auto grid flex-1 grid-cols-5 gap-5 px-10 md:px-[72px]">
          <Component {...pageProps} key={router.asPath} />
          <Footer />
        </div>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
      </div>
    );
  }

  // Earn layout (existing)
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
