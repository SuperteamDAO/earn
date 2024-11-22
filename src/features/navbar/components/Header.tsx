import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

import { useDisclosure } from '@/hooks/use-disclosure';

const Login = dynamic(() => import('@/features/auth').then((mod) => mod.Login));
const SearchModal = dynamic(() =>
  import('@/features/search').then((mod) => mod.SearchModal),
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
const DesktopNavbar = dynamic(() =>
  import('./DesktopNavbar').then((mod) => mod.DesktopNavbar),
);
const MobileNavbar = dynamic(() =>
  import('./MobileNavbar').then((mod) => mod.MobileNavbar),
);

export const Header = () => {
  const { data: session, status } = useSession();

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

  const posthog = usePostHog();
  function searchOpenWithEvent() {
    posthog.capture('initiate_search');
    onSearchOpen();
  }

  useEffect(() => {
    const checkHashAndOpenModal = () => {
      const hashHasEmail = window.location.hash === '#emailPreferences';
      if (hashHasEmail && status === 'unauthenticated' && !session) {
        onLoginOpen();
      }
    };

    checkHashAndOpenModal();
  }, [isLoginOpen, onLoginOpen, status]);

  return (
    <>
      {!!isLoginOpen && <Login isOpen={isLoginOpen} onClose={onLoginClose} />}
      <BountySnackbar />
      <GrantSnackbar />
      <div className="sticky top-0 z-40">
        <DesktopNavbar
          onLoginOpen={onLoginOpen}
          onSearchOpen={searchOpenWithEvent}
        />
      </div>

      <MobileNavbar onLoginOpen={onLoginOpen} />
      <SearchModal isOpen={isSearchOpen} onClose={onSearchClose} />
      <div className="fixed bottom-0 z-40 w-full">
        <BottomBar onSearchOpen={searchOpenWithEvent} />
      </div>
    </>
  );
};
