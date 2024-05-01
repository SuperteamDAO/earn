import { Box, useDisclosure } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { Login } from '@/features/auth';
import { SearchModal } from '@/features/search';

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
      {/* {isRootRoute && <AnnouncementBar />} */}
      <Box pos="sticky" zIndex="sticky" top={0}>
        <DesktopNavbar onLoginOpen={onLoginOpen} onSearchOpen={onSearchOpen} />
      </Box>

      <MobileNavbar onLoginOpen={onLoginOpen} onSearchOpen={onSearchOpen} />
      <SearchModal isOpen={isSearchOpen} onClose={onSearchClose} />
    </>
  );
};
