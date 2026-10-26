'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { posthog } from 'posthog-js';
import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { useDisclosure } from '@/hooks/use-disclosure';
import { getJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';

import type { TokenAsset } from '@/features/wallet/types/TokenAsset';
import { WALLET_CHANGED_EVENT } from '@/features/wallet/utils/wallet-messages';

import { useSignInHref } from '../hooks/use-here';
import { useShellData } from '../shell-data';
import { BottomBar } from './BottomBar';
import { BountySnackbar } from './BountySnackbar';
import { DesktopNavbar } from './DesktopNavbar';
import { GrantSnackbar } from './GrantSnackbar';
import { MobileNavbar } from './MobileNavbar';

const CreditDrawer = dynamic(
  () =>
    import('@/features/credits/components/CreditDrawer').then(
      (mod) => mod.CreditDrawer,
    ),
  { ssr: false },
);

const SearchModal = dynamic(() =>
  import('@/features/search/components/SearchModal').then(
    (mod) => mod.SearchModal,
  ),
);

interface HeaderProps {
  // The sponsor's stage snackbar, on the homepage only.
  readonly snackbar?: ReactNode;
}

// What their wallet holds, priced, for the header's badge. Loaded after
// the page: it asks the chain, too slow to hold the page for.
function useWalletBalance(enabled: boolean): number {
  const [balance, setBalance] = useState(0);
  // Bumped when the wallet changes (a withdrawal), to load it again.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onChange = () => setVersion((value) => value + 1);
    window.addEventListener(WALLET_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(WALLET_CHANGED_EVENT, onChange);
  }, []);
  useEffect(() => {
    if (!enabled) return () => {};
    const controller = new AbortController();
    getJson<TokenAsset[]>('/api/wallet/assets', controller.signal)
      .then((tokens) =>
        setBalance(
          tokens.reduce((acc, token) => acc + (token.usdValue || 0), 0),
        ),
      )
      .catch(() => undefined);
    return () => controller.abort();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `version` asks again
  }, [enabled, version]);
  return balance;
}

export const Header = ({ snackbar }: HeaderProps = {}) => {
  const viewer = useViewer();
  const { resuming, creditBalance } = useShellData();
  const authenticated = !!viewer;
  const searchParams = useSearchParams();
  const signIn = useSignInHref();

  const {
    isOpen: isSearchOpen,
    onOpen: onSearchOpen,
    onClose: onSearchClose,
  } = useDisclosure();

  const {
    isOpen: isCreditOpen,
    onOpen: onCreditOpen,
    onClose: onCreditClose,
  } = useDisclosure();

  function searchOpenWithEvent() {
    posthog.capture('initiate_search');
    onSearchOpen();
  }

  const openCreditWithEvent = useCallback(() => {
    posthog.capture('open_credits');
    onCreditOpen();
  }, [onCreditOpen]);

  // Links into a signed-in feature (emails, wallet, disputes, `?login`):
  // signed out, they sign in first and come back here.
  useEffect(() => {
    if (authenticated || resuming) return;
    const hash = window.location.hash;
    if (
      hash === '#emailPreferences' ||
      hash === '#wallet' ||
      hash.startsWith('#dispute-submission-') ||
      searchParams?.get('login') !== null
    ) {
      window.location.assign(`${signIn}${encodeURIComponent(hash)}`);
    }
  }, [authenticated, resuming, searchParams, signIn]);

  useEffect(() => {
    const url = window.location.href;
    const hashIndex = url.indexOf('#');
    const afterHash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
    const [hashValue] = afterHash.split('?');
    // `#wallet` opens the wallet drawer (WalletDrawerProvider).
    if (hashValue?.startsWith('dispute-submission-') && authenticated) {
      openCreditWithEvent();
    }
  }, [authenticated, openCreditWithEvent]);

  const walletBalance = useWalletBalance(!!viewer?.isTalentFilled);

  return (
    <>
      <BountySnackbar />
      <GrantSnackbar />
      <div className="sticky top-0 z-40">
        <DesktopNavbar
          signIn={signIn}
          resuming={resuming}
          onSearchOpen={searchOpenWithEvent}
          walletBalance={walletBalance}
          creditBalance={creditBalance}
          onCreditOpen={openCreditWithEvent}
        />
        {snackbar}
      </div>
      <MobileNavbar
        signIn={signIn}
        resuming={resuming}
        creditBalance={creditBalance}
        onCreditOpen={openCreditWithEvent}
      />
      <SearchModal isOpen={isSearchOpen} onClose={onSearchClose} />
      <div className="fixed bottom-0 z-60 w-full">
        <BottomBar
          onSearchOpen={searchOpenWithEvent}
          walletBalance={walletBalance}
        />
      </div>
      {isCreditOpen && (
        <CreditDrawer isOpen={isCreditOpen} onClose={onCreditClose} />
      )}
    </>
  );
};
