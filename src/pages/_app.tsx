import { GoogleAnalytics } from '@next/third-parties/google';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Providers from '@/components/providers';
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

  useEffect(() => {
    if (!isST || typeof window === 'undefined') {
      return;
    }

    let observer: MutationObserver | null = null;

    import('@/lib/gsap').then(({ gsap, ScrollTrigger }) => {
      document.documentElement.style.backgroundColor = 'rgb(4, 5, 7)';
      document.body.style.backgroundColor = 'rgb(4, 5, 7)';

      gsap.registerPlugin(ScrollTrigger);

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

      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLImageElement) {
              handleImageLoad(node);
            }
            if (node instanceof HTMLElement) {
              node
                .querySelectorAll('img')
                .forEach((img) => handleImageLoad(img));
            }
          });
        });
      });

      const stContainer = document.querySelector('.st-app');
      if (stContainer) {
        observer.observe(stContainer, { childList: true, subtree: true });
      }
    });

    return () => {
      observer?.disconnect();
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, [isST]);

  if (isST) {
    return (
      <div className={`${stFontVariables} st-app flex min-h-screen flex-col`}>
        <Head>
          <link
            rel="icon"
            type="image/png"
            href="/st-favicon.png"
            key="icon-png"
          />
        </Head>
        {router.pathname === '/' && (
          <div className="w-full bg-slate-950 text-white">
            <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center text-xs font-medium sm:text-sm">
              <a
                href="/earn/agents"
                className="font-mono text-[11px] tracking-[0.2em] text-white uppercase no-underline hover:text-white sm:text-xs"
              >
                If you&apos;re an AI agent, try out earning opportunities to
                earn your first dollar.
              </a>
            </div>
          </div>
        )}
        <Header className="mx-auto px-10 md:px-[72px]" />
        <div className="relative mx-auto grid flex-1 grid-cols-5 gap-5 px-10 md:px-[72px]">
          <Component {...pageProps} key={router.asPath} />
          <Footer />
        </div>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
      </div>
    );
  }

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
