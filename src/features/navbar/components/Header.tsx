import { Box, Text, useDisclosure } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

import { Snackbar } from '@/components/home/Snackbar';
import { Login } from '@/features/auth';
import { SearchModal } from '@/features/search';

import { BottomBar } from './BottomBar';
import { BountySnackbar } from './BountySnackbar';
import { DesktopNavbar } from './DesktopNavbar';
import { MobileNavbar } from './MobileNavbar';

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

      <Snackbar href="/talent-olympics">
        Looking to get hired?{' '}
        <Text display="inline" textDecor="underline">
          Click here
        </Text>{' '}
        to compete in the Talent Olympics — 30+ companies hiring!
      </Snackbar>
      <BountySnackbar />
      {/* {isRootRoute && <AnnouncementBar />} */}
      <Box pos="sticky" zIndex="sticky" top={0}>
        <DesktopNavbar
          onLoginOpen={onLoginOpen}
          onSearchOpen={searchOpenWithEvent}
        />
      </Box>

      <MobileNavbar onLoginOpen={onLoginOpen} />
      <SearchModal isOpen={isSearchOpen} onClose={onSearchClose} />
      <Box pos="fixed" zIndex="sticky" bottom={0} w="full">
        <BottomBar onSearchOpen={searchOpenWithEvent} />
      </Box>
    </>
  );
};
