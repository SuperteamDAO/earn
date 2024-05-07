import { Box } from '@chakra-ui/react';

import { DesktopNavbar } from './DesktopNavbar';
import { MobileNavbar } from './MobileNavbar';

export const Header = () => {
  return (
    <Box pos="sticky" zIndex="sticky" top={0}>
      <DesktopNavbar />
      <MobileNavbar />
    </Box>
  );
};
