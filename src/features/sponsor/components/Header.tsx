import { Box, useDisclosure } from '@chakra-ui/react';

import { Login } from '@/features/auth';

import { DesktopNavbar } from './DesktopNavbar';
import { MobileNavbar } from './MobileNavbar';

export const Header = () => {
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

  return (
    <>
      {!!isLoginOpen && <Login isOpen={isLoginOpen} onClose={onLoginClose} />}

      <Box pos="sticky" zIndex="sticky" top={0}>
        <DesktopNavbar onLoginOpen={onLoginOpen} />
      </Box>

      <MobileNavbar onLoginOpen={onLoginOpen} />
    </>
  );
};
