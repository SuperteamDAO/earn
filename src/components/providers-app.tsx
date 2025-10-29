'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { Toaster } from 'sonner';

import { TopLoader } from './ui/toploader';

export function ProvidersApp({
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
