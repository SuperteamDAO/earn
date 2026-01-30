import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { useDisclosure } from '@/hooks/use-disclosure';

import { tokenAssetsQuery } from '@/features/wallet/queries/fetch-assets';

const Login = dynamic(
  () => import('@/features/auth/components/Login').then((mod) => mod.Login),
  { ssr: false },
);
const CreditDrawer = dynamic(
  () =>
    import('@/features/credits/components/CreditDrawer').then(
      (mod) => mod.CreditDrawer,
    ),
  { ssr: false },
);
const ReferralModal = dynamic(
  () =>
    import('@/features/credits/components/ReferralModal').then(
      (mod) => mod.ReferralModal,
    ),
  { ssr: false },
);
const WalletDrawer = dynamic(
  () =>
    import('@/features/wallet/components/WalletDrawer').then(
      (mod) => mod.WalletDrawer,
    ),
  { ssr: false },
);

const SearchModal = dynamic(() =>
  import('@/features/search/components/SearchModal').then(
    (mod) => mod.SearchModal,
  ),
);
const BottomBar = dynamic(() =>
  import('./BottomBar').then((mod) => mod.BottomBar),
);
const BountySnackbar = dynamic(() =>
  import('./BountySnackbar').then((mod) => mod.BountySnackbar),
);
const GrantSnackbar = dynamic(() =>
  import('./GrantSnackbar').then((mod) => mod.GrantSnackbar),
);
const SponsorStageSnackbar = dynamic(() =>
  import('@/features/home/components/SponsorStage/SponsorStageSnackbar').then(
    (mod) => mod.SponsorStageSnackbar,
  ),
);
const DesktopNavbar = dynamic(() =>
  import('./DesktopNavbar').then((mod) => mod.DesktopNavbar),
);
const MobileNavbar = dynamic(() =>
  import('./MobileNavbar').then((mod) => mod.MobileNavbar),
);

export const Header = () => {
  const { authenticated, ready } = usePrivy();
  const searchParams = useSearchParams();

  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

  const {
    isOpen: isSearchOpen,
    onOpen: onSearchOpen,
    onClose: onSearchClose,
  } = useDisclosure();

  const {
    isOpen: isWalletOpen,
    onOpen: onWalletOpen,
    onClose: onWalletClose,
  } = useDisclosure();

  const {
    isOpen: isCreditOpen,
    onOpen: onCreditOpen,
    onClose: onCreditClose,
  } = useDisclosure();

  const {
    isOpen: isReferralOpen,
    onOpen: onReferralOpen,
    onClose: onReferralClose,
  } = useDisclosure();

  function searchOpenWithEvent() {
    posthog.capture('initiate_search');
    onSearchOpen();
  }

  const openWalletWithEvent = () => {
    posthog.capture('open_wallet_drawer');
    onWalletOpen();
  };

  const openCreditWithEvent = () => {
    posthog.capture('open_credits');
    onCreditOpen();
  };

  const openReferralWithEvent = () => {
    posthog.capture('open_referrals');
    onReferralOpen();
  };

  useEffect(() => {
    const checkHashAndOpenModal = () => {
      const hashHasEmail = window.location.hash === '#emailPreferences';
      const hashHasWallet = window.location.hash === '#wallet';
      const hashHasDispute =
        window.location.hash.startsWith('#dispute-submission-') || false;
      const hasLoginParam = searchParams?.get('login') !== null;

      if (
        (hashHasEmail || hashHasWallet || hashHasDispute || hasLoginParam) &&
        ready &&
        !authenticated
      ) {
        onLoginOpen();
      }
    };

    checkHashAndOpenModal();
  }, [isLoginOpen, onLoginOpen, ready, authenticated, searchParams]);

  useEffect(() => {
    const checkHashAndOpenModal = () => {
      const url = window.location.href;
      const hashIndex = url.indexOf('#');
      const afterHash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
      const [hashValue] = afterHash.split('?');
      const hashHasWallet = hashValue === 'wallet';
      const hashHasDispute =
        hashValue?.startsWith('dispute-submission-') || false;

      if (hashHasWallet) {
        openWalletWithEvent();
      } else if (hashHasDispute && authenticated) {
        openCreditWithEvent();
      }
    };

    checkHashAndOpenModal();
  }, [isWalletOpen, onWalletOpen, authenticated, onCreditOpen]);

  const {
    data: tokens,
    isLoading,
    error,
  } = useQuery({
    ...tokenAssetsQuery,
    enabled: authenticated,
  });

  const walletBalance = tokens?.reduce((acc, token) => {
    return acc + (token.usdValue || 0);
  }, 0);

  return (
    <>
      <Login isOpen={isLoginOpen} onClose={onLoginClose} onOpen={onLoginOpen} />
      <BountySnackbar />
      <GrantSnackbar />
      <div className="sticky top-0 z-40">
        <DesktopNavbar
          onLoginOpen={onLoginOpen}
          onSearchOpen={searchOpenWithEvent}
          onWalletOpen={openWalletWithEvent}
          walletBalance={walletBalance || 0}
          onCreditOpen={openCreditWithEvent}
          onReferralOpen={openReferralWithEvent}
        />
        <SponsorStageSnackbar />
      </div>
      <MobileNavbar
        onLoginOpen={onLoginOpen}
        onCreditOpen={openCreditWithEvent}
        onReferralOpen={openReferralWithEvent}
      />
      <SearchModal isOpen={isSearchOpen} onClose={onSearchClose} />
      <div className="fixed bottom-0 z-60 w-full">
        <BottomBar
          onSearchOpen={searchOpenWithEvent}
          onWalletOpen={openWalletWithEvent}
          walletBalance={walletBalance || 0}
        />
      </div>
      <WalletDrawer
        tokens={tokens || []}
        isLoading={isLoading}
        error={error}
        isOpen={isWalletOpen}
        onClose={onWalletClose}
      />
      <ReferralModal isOpen={isReferralOpen} onClose={onReferralClose} />
      <CreditDrawer isOpen={isCreditOpen} onClose={onCreditClose} />
    </>
  );
};
