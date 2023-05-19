import type { BoxProps, FlexProps } from '@chakra-ui/react';
import { Box, Flex, Icon, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode, ReactText } from 'react';
import React from 'react';
import type { IconType } from 'react-icons';
import { AiFillFire } from 'react-icons/ai';

import SelectSponsor from '@/components/SelectSponsor/SelectSponsor';
import LoadingSection from '@/components/shared/LoadingSection';
import Banner from '@/components/sidebar/Banner';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

interface LinkItemProps {
  name: string;
  link: string;
  icon: IconType;
}
const LinkItems: Array<LinkItemProps> = [
  { name: 'Bounties', link: '/bounties', icon: AiFillFire },
  // { name: 'Members', link: '/members', icon: AiOutlineUsergroupAdd },
];

interface NavItemProps extends FlexProps {
  icon: IconType;
  link: string;
  isActive: boolean;
  children: ReactText;
}

const NavItem = ({ icon, link, isActive, children, ...rest }: NavItemProps) => {
  return (
    <Link
      as={NextLink}
      _focus={{ boxShadow: 'none' }}
      href={`/dashboard${link}`}
      style={{ textDecoration: 'none' }}
    >
      <Flex
        align="center"
        mb={2}
        px={6}
        py={3}
        color={isActive ? 'brand.purple' : 'brand.slate.500'}
        bg={isActive ? 'brand.slate.100' : 'transparent'}
        _hover={{
          bg: 'brand.slate.100',
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
      <Box pb={6} px={6}>
        <SelectSponsor />
      </Box>
      {/* <Flex align="center" justify="space-between" pb={6} px={6}>
        <Button
          w="full"
          fontSize="sm"
          isDisabled
          leftIcon={<AddIcon w={3} h={3} />}
          variant="solid"
        >
          Create Listing
        </Button>
      </Flex> */}
      {LinkItems.map((link) => (
        <NavItem
          key={link.name}
          icon={link.icon}
          link={link.link}
          isActive={currentPath === link.link}
        >
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

export default function SimpleSidebar({ children }: { children: ReactNode }) {
  const { userInfo } = userStore();

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
      {!userInfo?.id ? (
        <LoadingSection />
      ) : (
        <Flex justify="start">
          <SidebarContent display={{ base: 'none', md: 'block' }} />
          {!userInfo?.currentSponsor?.id ? (
            <LoadingSection />
          ) : (
            <Box w="full" px={6} py={8} bg="brand.grey.50">
              <Banner />
              {children}
            </Box>
          )}
        </Flex>
      )}
    </Default>
  );
}
