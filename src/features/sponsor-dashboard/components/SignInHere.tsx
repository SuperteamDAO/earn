'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { ResumingPage } from '@/lib/auth/resume-session';
import { signInHref } from '@/lib/safe-next';

// A signed-out visitor on a dashboard page that didn't tell the layout its
// URL: renew their lapsed session here, or send them to sign in and back.
export function SignInHere({ canResume }: { canResume: boolean }) {
  const pathname = usePathname() ?? '/earn/dashboard/listings/';
  const search = useSearchParams()?.toString() ?? '';
  const signIn = signInHref(search ? `${pathname}?${search}` : pathname);
  useEffect(() => {
    if (!canResume) window.location.assign(signIn);
  }, [canResume, signIn]);
  return canResume ? <ResumingPage signIn={signIn} /> : null;
}
