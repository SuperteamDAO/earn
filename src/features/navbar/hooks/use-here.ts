'use client';

import { usePathname, useSearchParams } from 'next/navigation';

import { signInHref } from '@/lib/safe-next';

// This page as Earn's `router.asPath` read it, without the trailing slash
// (`/earn/all?tab=bounties`), for comparing with Earn's nav hrefs.
export function useAsPath(): string {
  const pathname = usePathname() ?? '/';
  const search = useSearchParams()?.toString() ?? '';
  const path =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;
  return search ? `${path}?${search}` : path;
}

// Where Login and Sign Up go: sign-in, then back to this page.
export function useSignInHref(): string {
  const pathname = usePathname() ?? '/earn/';
  const search = useSearchParams()?.toString() ?? '';
  return signInHref(search ? `${pathname}?${search}` : pathname);
}
