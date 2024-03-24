import { Box, useDisclosure } from '@chakra-ui/react';
import { useRouter } from 'next/router';

import { Login } from '@/components/modals/Login/Login';

import { AnnouncementBar } from './AnnouncementBar';
import { BountySnackbar } from './BountySnackbar';
import { DesktopNavbar } from './DesktopNavbar';
import { MobileNavbar } from './MobileNavbar';

export const Header = () => {
  const router = useRouter();

  const isRootRoute = router.pathname === '/';
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

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
