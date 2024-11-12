import { Box, Menu, MenuButton } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

export const LogoContextMenu = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();

  return (
    <Box display={{ base: 'none', md: 'block' }}>
      <Menu>
        <MenuButton
          as={Box}
          cursor={'pointer'}
          onClick={() => router.push('/')}
        >
          {children}
        </MenuButton>
      </Menu>
    </Box>
  );
};
