import type { BoxProps, FlexProps } from '@chakra-ui/react';
import {
  Box,
  Flex,
  Icon,
  Link,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ReactNode, ReactText } from 'react';
import React from 'react';
import type { IconType } from 'react-icons';
import {
  FiCompass,
  FiHome,
  FiSettings,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface LinkItemProps {
  name: string;
  icon: IconType;
}
const LinkItems: Array<LinkItemProps> = [
  { name: 'Home', icon: FiHome },
  { name: 'Trending', icon: FiTrendingUp },
  { name: 'Explore', icon: FiCompass },
  { name: 'Favourites', icon: FiStar },
  { name: 'Settings', icon: FiSettings },
];

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: ReactText;
}
const NavItem = ({ icon, children, ...rest }: NavItemProps) => {
  return (
    <Link
      _focus={{ boxShadow: 'none' }}
      href="#"
      style={{ textDecoration: 'none' }}
    >
      <Flex
        align="center"
        mx="4"
        p="4"
        borderRadius="lg"
        _hover={{
          bg: 'cyan.400',
          color: 'white',
        }}
        cursor="pointer"
        role="group"
        {...rest}
      >
        {icon && (
          <Icon
            as={icon}
            mr="4"
            fontSize="16"
            _groupHover={{
              color: 'white',
            }}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

const SidebarContent = ({ ...rest }: BoxProps) => {
  return (
    <Box
      pos="fixed"
      w={{ base: 'full', md: 60 }}
      h="full"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      {...rest}
    >
      <Flex align="center" justify="space-between" h="20" mx="8">
        <Text fontFamily="monospace" fontSize="2xl" fontWeight="bold">
          Logo
        </Text>
      </Flex>
      {LinkItems.map((link) => (
        <NavItem key={link.name} icon={link.icon}>
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

export default function SimpleSidebar({ children }: { children: ReactNode }) {
  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Dashboard | Superteam Earn"
          description="Every Solana opportunity in one place!"
          canonical="/assets/logo/og.svg"
        />
      }
    >
      <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')}>
        <SidebarContent display={{ base: 'none', md: 'block' }} />
        <Box ml={{ base: 0, md: 60 }} p="4">
          {children}
        </Box>
      </Box>
    </Default>
  );
}
