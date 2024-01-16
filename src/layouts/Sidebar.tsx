import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons';
import type { BoxProps, FlexProps } from '@chakra-ui/react';
import {
  Box,
  Button,
  Flex,
  Icon,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode, ReactText } from 'react';
import React from 'react';
import type { IconType } from 'react-icons';
import { AiFillFire, AiOutlineUsergroupAdd } from 'react-icons/ai';

import { SelectSponsor } from '@/components/SelectSponsor/SelectSponsor';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Banner } from '@/components/sidebar/Banner';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

interface LinkItemProps {
  name: string;
  link: string;
  icon: IconType;
}

const LinkItems: Array<LinkItemProps> = [
  { name: 'Listings', link: '/bounties', icon: AiFillFire },
  { name: 'Members', link: '/members', icon: AiOutlineUsergroupAdd },
];

interface NavItemProps extends FlexProps {
  icon: IconType;
  link: string;
  isActive: boolean;
  children: ReactText;
}

const NavItem = ({ icon, link, isActive, children, ...rest }: NavItemProps) => (
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
      <Box px={6} pb={6}>
        <SelectSponsor />
      </Box>
      <Flex align="center" justify="space-between" px={6} pb={6}>
        <Menu>
          <MenuButton
            as={Button}
            w="full"
            fontSize="sm"
            leftIcon={<AddIcon w={3} h={3} />}
            variant="solid"
          >
            Create Listing <ChevronDownIcon w={3} h={3} />
          </MenuButton>
          <MenuList>
            <NextLink href="/dashboard/create-bounty">
              <MenuItem>
                <Image
                  h={5}
                  mr={3}
                  ml={1}
                  alt="new bounty"
                  src={'/assets/icons/bolt.svg'}
                />{' '}
                <Text color="brand.slate.500" fontWeight={500}>
                  New Bounty
                </Text>
              </MenuItem>
            </NextLink>
            <NextLink href="/dashboard/create-project">
              <MenuItem>
                <Image
                  h={5}
                  mr={3}
                  ml={1}
                  alt="new project"
                  src={'/assets/icons/briefcase.svg'}
                />{' '}
                <Text color="brand.slate.500" fontWeight={500}>
                  New Project
                </Text>
              </MenuItem>
            </NextLink>
          </MenuList>
        </Menu>
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

export function Sidebar({ children }: { children: ReactNode }) {
  const { userInfo } = userStore();

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
