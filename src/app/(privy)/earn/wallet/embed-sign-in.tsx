'use client';

import { useEffect } from 'react';

import { WALLET_SIGN_IN } from '@/features/wallet/utils/wallet-messages';

// Framed by the wallet drawer while signed out (or with a lapsed session):
// sign-in can't load in this frame, so the drawer opens Earn's sign-in
// dialog instead.
export function EmbedSignIn() {
  useEffect(() => {
    if (window.parent === window) return;
    window.parent.postMessage({ type: WALLET_SIGN_IN }, window.location.origin);
  }, []);
  return null;
}
