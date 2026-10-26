'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ComponentProps, useCallback } from 'react';

// Privy's pages (sign-in, wallet) are documents with their own CSP; the
// shell on them must leave by full page loads, never client-side.
const PRIVY_PAGES = ['/earn/signin', '/earn/wallet'];

export function useOnPrivyPage(): boolean {
  const pathname = usePathname() ?? '';
  return PRIVY_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
}

// The shell's links: next/link, or a plain <a> on a Privy page.
export function ShellLink({
  href,
  prefetch,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const onPrivyPage = useOnPrivyPage();
  if (onPrivyPage) {
    // oxlint-disable-next-line nextjs/no-html-link-for-pages -- see above
    return <a href={href} {...props} />;
  }
  return <Link href={href} prefetch={prefetch} {...props} />;
}

// router.push, or a full page load on a Privy page.
export function useShellNavigate() {
  const router = useRouter();
  const onPrivyPage = useOnPrivyPage();
  return useCallback(
    (href: string) => {
      if (onPrivyPage) window.location.assign(href);
      else router.push(href);
    },
    [onPrivyPage, router],
  );
}
