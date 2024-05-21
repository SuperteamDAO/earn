import { HamburgerIcon, SearchIcon } from '@chakra-ui/icons';
import {
  AbsoluteCenter,
  Box,
  Button,
  CloseButton,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  IconButton,
  Image,
  Link,
  useDisclosure,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React, { useRef } from 'react';

import { UserMenu } from '@/components/shared/UserMenu';
import { userStore } from '@/store/user';

import {
  CATEGORY_NAV_ITEMS,
  HACKATHON_NAV_ITEMS,
  LISTING_NAV_ITEMS,
  renderLabel,
} from '../constants';
import { NavLink } from './NavLink';

interface Props {
  onLoginOpen: () => void;
  onSearchOpen: () => void;
}

export const MobileNavbar = ({ onLoginOpen, onSearchOpen }: Props) => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { data: session, status } = useSession();

  const btnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const { userInfo } = userStore();

  const MobileDrawer = () => {
    return (
      <Drawer
        finalFocusRef={btnRef}
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        placement="left"
      >
        <DrawerOverlay display={{ base: 'block', xl: 'none' }} />
        <DrawerContent display={{ base: 'block', xl: 'none' }}>
          <Flex px={3} py={2}>
            <CloseButton onClick={onDrawerClose} />
          </Flex>
          <DrawerBody>
            {status === 'unauthenticated' && !session && (
              <Flex align="center" gap={3}>
                <Button
                  color="brand.slate.500"
                  fontSize="md"
                  onClick={() => {
                    onDrawerClose();
                    onLoginOpen();
                  }}
                  size="md"
                  variant="unstyled"
                >
                  Login
                </Button>
                <Divider
                  h={5}
                  borderWidth={'0.5px'}
                  borderColor={'brand.slate.300'}
                  orientation="vertical"
                />
                <Button
                  color="brand.purple"
                  fontSize="md"
                  onClick={() => {
                    onDrawerClose();
                    onLoginOpen();
                  }}
                  size="md"
                  variant="unstyled"
                >
                  Sign Up
                </Button>
              </Flex>
            )}

            {userInfo &&
              !userInfo.currentSponsorId &&
              !userInfo.isTalentFilled && (
                <Button
                  color={'brand.purple'}
                  fontSize="md"
                  onClick={() => {
                    router.push('/new');
                  }}
                  size="md"
                  variant="unstyled"
                >
                  Complete your Profile
                </Button>
              )}

            <Flex direction={'column'} mt={5}>
              {HACKATHON_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    key={navItem.label}
                    href={navItem.href ?? '#'}
                    label={renderLabel(navItem)}
                    isActive={isCurrent}
                  />
                );
              })}
            </Flex>
            <Divider my={2} borderColor={'brand.slate.300'} />
            <Flex direction={'column'}>
              {LISTING_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    key={navItem.label}
                    href={navItem.href ?? '#'}
                    label={renderLabel(navItem)}
                    isActive={isCurrent}
                  />
                );
              })}
            </Flex>
            <Divider my={2} borderColor={'brand.slate.300'} />
            <Flex direction={'column'}>
              {CATEGORY_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    key={navItem.label}
                    href={navItem.href ?? '#'}
                    label={renderLabel(navItem)}
                    isActive={isCurrent}
                  />
                );
              })}
            </Flex>
            <Divider my={2} borderColor={'brand.slate.300'} />
            <NavLink href={'/feed'} label={'Activity Feed'} isActive={false} />
            <NavLink
              href={'/leaderboard'}
              label={'Leaderboard'}
              isActive={false}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <>
      <Box pos="sticky" zIndex="sticky" top={0}>
        <Flex
          align="center"
          justify="space-between"
          display={{ base: 'flex', xl: 'none' }}
          px={1}
          py={2}
          bg="white"
          borderBottom="1px solid"
          borderBottomColor="blackAlpha.200"
        >
          <Flex>
            <IconButton
              ref={btnRef}
              bg="transparent"
              _hover={{ bg: 'transparent' }}
              _active={{ bg: 'transparent' }}
              aria-label="Open Drawer"
              icon={<HamburgerIcon h={6} w={6} color="brand.slate.500" />}
              onClick={onDrawerOpen}
            />

            {router.pathname !== '/search' && (
              <IconButton
                gap={2}
                color="brand.slate.400"
                fontWeight={400}
                border={'none'}
                borderColor={'brand.slate.300'}
                _hover={{ bg: 'transparent' }}
                _active={{ bg: 'transparent' }}
                aria-label="Open Search"
                icon={<SearchIcon />}
                onClick={onSearchOpen}
                variant="outline"
              />
            )}
          </Flex>

          <MobileDrawer />
          <AbsoluteCenter>
            <Link
              as={NextLink}
              alignItems={'center'}
              _hover={{ textDecoration: 'none' }}
              href="/"
            >
              <Image
                h={5}
                cursor="pointer"
                objectFit={'contain'}
                alt={'Superteam Earn'}
                src={'/assets/logo/logo.svg'}
              />
            </Link>
          </AbsoluteCenter>
          {status === 'authenticated' && session && <UserMenu />}
          {status === 'unauthenticated' && !session && (
            <Button
              mr={2}
              color="brand.purple"
              fontSize="md"
              onClick={() => {
                onLoginOpen();
              }}
              size="sm"
              variant="unstyled"
            >
              Login
            </Button>
          )}
        </Flex>
      </Box>
      <Flex
        align={'center'}
        justify={'space-between'}
        display={{ base: 'flex', xl: 'none' }}
        px={{ base: 3, sm: 4 }}
        py={2}
        bg={'#F8FAFC'}
      >
        <Flex gap={{ base: 2, sm: 8, md: 12 }}>
          {LISTING_NAV_ITEMS?.map((navItem) => {
            const isCurrent = `${navItem.href}` === router.asPath;
            return (
              <NavLink
                key={navItem.label}
                href={navItem.href ?? '#'}
                label={renderLabel(navItem)}
                isActive={isCurrent}
                fontSize={{ base: '12px', xs: '13px', md: '15px' }}
                fontWeight={500}
                borderBottom={'none'}
                h={'auto'}
              />
            );
          })}
        </Flex>
        <Divider
          display={{ base: 'flex', md: 'none' }}
          h={5}
          borderWidth={'0.5px'}
          borderColor={'brand.slate.400'}
          orientation="vertical"
        />
        <Flex gap={{ base: 2, sm: 8, md: 12 }}>
          {CATEGORY_NAV_ITEMS?.map((navItem) => {
            const isCurrent = `${navItem.href}` === router.asPath;
            return (
              <NavLink
                key={navItem.label}
                href={navItem.href ?? '#'}
                label={renderLabel(navItem)}
                isActive={isCurrent}
                fontSize={{ base: '11.5px', xs: '13px', md: '15px' }}
                fontWeight={500}
                h={'auto'}
                borderBottom={'none'}
              />
            );
          })}
        </Flex>
      </Flex>
    </>
  );
};
