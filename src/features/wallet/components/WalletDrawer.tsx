'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useSignIn } from '@/lib/auth/sign-in-dialog';

import type { TokenAsset } from '../types/TokenAsset';
import {
  WALLET_CHANGED,
  WALLET_CHANGED_EVENT,
  WALLET_SIGN_IN,
} from '../utils/wallet-messages';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Earn's wallet drawer. Signing withdrawals needs Privy's SDK, which may only
// load on the wallet page (its own document, with its own CSP), so the
// drawer frames that page: balances, activity and the whole withdraw flow
// live in the frame, and this page loads none of it.
//
// `tokens`, `isLoading` and `error` are Earn's props, kept so callers still
// fit; the framed page loads its own.
export function WalletDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  tokens?: TokenAsset[];
  isLoading?: boolean;
  error?: Error | null;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const signIn = useSignIn();

  const handleClose = () => {
    if (window.location.hash === '#wallet') {
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search,
      );
    }
    onClose();
  };

  // What the framed wallet page says.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        !isRecord(event.data)
      ) {
        return;
      }
      if (event.data.type === WALLET_SIGN_IN) {
        onClose();
        signIn(`${window.location.pathname}${window.location.search}#wallet`);
      } else if (event.data.type === WALLET_CHANGED) {
        window.dispatchEvent(new Event(WALLET_CHANGED_EVENT));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isOpen, onClose, signIn]);

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose}>
      <SideDrawerContent className="w-screen overflow-hidden sm:w-120">
        <X
          className="absolute top-5 right-4 z-10 h-5 w-5 cursor-pointer text-slate-600 sm:hidden"
          onClick={handleClose}
        />
        {/* Earn's own wallet page, same origin: Privy needs its scripts and
            cookies there, which no sandbox would leave. */}
        {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
        <iframe
          ref={frame}
          title="Wallet"
          src="/earn/wallet/?embed=1"
          className="block h-full w-full border-0"
        />
      </SideDrawerContent>
    </SideDrawer>
  );
}
