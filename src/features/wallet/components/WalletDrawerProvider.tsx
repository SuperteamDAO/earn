'use client';

import { posthog } from 'posthog-js';
import { createContext, useCallback, useEffect, useState } from 'react';

import { useSignIn } from '@/lib/auth/sign-in-dialog';
import { useViewer } from '@/lib/viewer';

import { WalletDrawer } from './WalletDrawer';

const WALLET_PATH = '/earn/wallet/';

const WalletDrawerContext = createContext<() => void>(() => {});

const isWalletUrl = (url: URL) =>
  url.origin === window.location.origin &&
  (url.pathname === '/earn/wallet' || url.pathname === WALLET_PATH) &&
  !url.searchParams.has('embed');

// The wallet drawer, on every page. Plain links to /earn/wallet/ (the
// header's) and `#wallet` links (emails) open it instead of leaving; signed
// out, they sign in first and come back with the drawer open.
export function WalletDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = useViewer();
  const signIn = useSignIn();
  const [isOpen, setIsOpen] = useState(false);
  const signedIn = viewer !== null;

  const open = useCallback(() => {
    if (!signedIn) {
      signIn(`${window.location.pathname}${window.location.search}#wallet`);
      return;
    }
    posthog.capture('open_wallet_drawer');
    setIsOpen(true);
  }, [signedIn, signIn]);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const link = event.target.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') {
        return;
      }
      if (!isWalletUrl(new URL(link.href, window.location.href))) return;
      // On the wallet page itself, the link stays a link.
      if (window.location.pathname.startsWith('/earn/wallet')) return;
      event.preventDefault();
      open();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  // `#wallet` (emails, and after signing in) opens it.
  useEffect(() => {
    if (!signedIn || window.location.pathname.startsWith('/earn/wallet')) {
      return undefined;
    }
    const onHash = () => {
      if (window.location.hash === '#wallet') setIsOpen(true);
    };
    const initial = window.setTimeout(onHash, 0);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener('hashchange', onHash);
    };
  }, [signedIn]);

  return (
    <WalletDrawerContext value={open}>
      {children}
      <WalletDrawer isOpen={isOpen} onClose={close} />
    </WalletDrawerContext>
  );
}
