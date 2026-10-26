'use client';

import { useEffect } from 'react';

import type { TokenAsset } from '../types/TokenAsset';

// The wallet is a page now (/earn/wallet/, a Privy document, so a full page
// load). Kept until the header links there instead: opening it goes there.
export function WalletDrawer({
  isOpen,
}: {
  isOpen: boolean;
  onClose: () => void;
  tokens: TokenAsset[];
  isLoading: boolean;
  error: Error | null;
}) {
  useEffect(() => {
    if (isOpen) window.location.assign('/earn/wallet/');
  }, [isOpen]);
  return null;
}
