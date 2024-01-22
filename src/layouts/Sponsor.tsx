import { AddIcon } from '@chakra-ui/icons';
import type { BoxProps, FlexProps } from '@chakra-ui/react';
import { Box, Button, Flex, Icon, Link, useDisclosure } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import type { ReactNode, ReactText } from 'react';
import React from 'react';
import type { IconType } from 'react-icons';
import {
  MdList,
  MdOutlineChatBubbleOutline,
  MdOutlineGroup,
} from 'react-icons/md';

import CreateListingModal from '@/components/modals/createListing';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Banner } from '@/components/sponsor/Banner';
import { SelectSponsor } from '@/components/sponsor/SelectSponsor';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

interface LinkItemProps {
  name: string;
  link: string;
  icon: IconType;
  isExternal?: boolean;
}

const LinkItems: Array<LinkItemProps> = [
  { name: 'My Listings', link: '/listings', icon: MdList },
  { name: 'Members', link: '/members', icon: MdOutlineGroup },
  {
    name: 'Get Help',
    link: 'https://discord.com/channels/857091160295866388/1192795350277312662',
    icon: MdOutlineChatBubbleOutline,
  },
];

interface NavItemProps extends FlexProps {
  icon: IconType;
  link: string;
  isActive: boolean;
  children: ReactText;
}

const NavItem = ({ icon, link, isActive, children, ...rest }: NavItemProps) => {
  const isExternalLink = link.startsWith('https://');

  return (
    <Link
      as={NextLink}
      _focus={{ boxShadow: 'none' }}
      href={isExternalLink ? link : `/dashboard${link}`}
      isExternal={isExternalLink}
      style={{ textDecoration: 'none' }}
    >
      <Flex
        align="center"
        px={6}
        py={3}
        color={isActive ? 'brand.purple' : 'brand.slate.500'}
        bg={isActive ? '#EEF2FF' : 'transparent'}
        _hover={{
          bg: '#F5F8FF',
          color: 'brand.purple',
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
              color: 'brand.purple',
            }}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

const SidebarContent = ({ ...rest }: BoxProps) => {
  const router = useRouter();
  const currentPath = `/${router.route?.split('/')[2]}` || '';
  const { userInfo } = userStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box
      w={{ base: 0, md: 80 }}
      h="full"
      pt={8}
      pb={80}
      bg="white"
      borderRight={'1px solid'}
      borderRightColor={'blackAlpha.200'}
      {...rest}
    >
      {userInfo?.role === 'GOD' && (
        <Box px={6} pb={6}>
          <SelectSponsor />
        </Box>
      )}
      <CreateListingModal isOpen={isOpen} onClose={onClose} />
      <Flex align="center" justify="space-between" px={6} pb={6}>
        <Button
          w="full"
          py={'22px'}
          fontSize="md"
          leftIcon={<AddIcon w={3} h={3} />}
          onClick={() => onOpen()}
          variant="solid"
        >
          Create New Listing
        </Button>
      </Flex>
      {LinkItems.map((link) => (
        <NavItem
          key={link.name}
          link={link.link}
          icon={link.icon}
          isActive={currentPath === link.link}
        >
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

export function Sidebar({
  children,
  showBanner = false,
}: {
  children: ReactNode;
  showBanner?: boolean;
}) {
  const { userInfo } = userStore();
  const { data: session, status } = useSession();
  const router = useRouter();

  if (!session && status === 'loading') {
    return <LoadingSection />;
  }

  if (!session && status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Superteam Earn |  Bounties, Grants, and Jobs in Crypto"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      <Flex justify="start">
        <SidebarContent display={{ base: 'none', md: 'block' }} />
        {!userInfo?.currentSponsor?.id ? (
          <LoadingSection />
        ) : (
          <Box w="full" px={6} py={8} bg="white">
            {showBanner && <Banner />}
            {children}
          </Box>
        )}
      </Flex>
    </Default>
  );
}
