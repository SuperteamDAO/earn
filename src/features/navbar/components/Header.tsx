import { Box, useDisclosure } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { Login } from '@/features/auth';

import { AnnouncementBar } from './AnnouncementBar';
import { BountySnackbar } from './BountySnackbar';
import { DesktopNavbar } from './DesktopNavbar';
import { MobileNavbar } from './MobileNavbar';

export const Header = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isRootRoute = router.pathname === '/';
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

  useEffect(() => {
    const checkHashAndOpenModal = () => {
      console.log(window.location.hash);
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
      {isRootRoute && <AnnouncementBar />}
      <Box pos="sticky" zIndex="sticky" top={0}>
        <DesktopNavbar onLoginOpen={onLoginOpen} />
      </Box>

      <MobileNavbar onLoginOpen={onLoginOpen} />
    </>
  );
};
