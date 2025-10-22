'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import dynamic from 'next/dynamic';

const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster), {
  ssr: false,
});

const TopLoader = dynamic(
  () => import('@/components/ui/toploader').then((mod) => mod.TopLoader),
  { ssr: false },
);

export function ClientProviders({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <>
      <TopLoader />
      {children}
      <Toaster position="bottom-right" richColors />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID!} />
    </>
  );
}
