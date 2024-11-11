import { HamburgerIcon } from '@chakra-ui/icons';
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
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';

import { useUser } from '@/store/user';

import {
  CATEGORY_NAV_ITEMS,
  LISTING_NAV_ITEMS,
  renderLabel,
} from '../constants';
import { NavLink } from './NavLink';

interface Props {
  onLoginOpen: () => void;
}

const UserMenu = dynamic(() =>
  import('./UserMenu').then((mod) => mod.UserMenu),
);

export const MobileNavbar = ({ onLoginOpen }: Props) => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { data: session, status } = useSession();
  const posthog = usePostHog();

  const btnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const { user } = useUser();

  const [hideListingTypes, setHideListingTypes] = useState(false);
  useEffect(() => {
    const listingPage = router.asPath.split('/')[1] === 'listings';
    // can add more when needed, create more, add those variables below with OR (a || b) format
    setHideListingTypes(listingPage);
  }, []);

  const MobileDrawer = () => {
    return (
      <Drawer
        finalFocusRef={btnRef}
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        placement="left"
      >
        <DrawerOverlay display={{ base: 'block', lg: 'none' }} />
        <DrawerContent
          className="ph-no-capture"
          display={{ base: 'block', lg: 'none' }}
        >
          <Flex px={3} py={2}>
            <CloseButton onClick={onDrawerClose} />
          </Flex>
          <DrawerBody>
            {status === 'unauthenticated' && !session && (
              <Flex className="ph-no-capture" align="center" gap={3}>
                <Button
                  color="brand.slate.500"
                  fontSize="md"
                  onClick={() => {
                    posthog.capture('login_navbar');
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
                    posthog.capture('signup_navbar');
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

            {user && !user.currentSponsorId && !user.isTalentFilled && (
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
            <Divider my={2} borderColor={'brand.slate.300'} />
            <Flex className="ph-no-capture" direction={'column'}>
              {LISTING_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    onClick={() => {
                      posthog.capture(navItem.posthog);
                    }}
                    key={navItem.label}
                    className="ph-no-capture"
                    href={navItem.href ?? '#'}
                    label={renderLabel(navItem)}
                    isActive={isCurrent}
                  />
                );
              })}
            </Flex>
            <Divider my={2} borderColor={'brand.slate.300'} />
            <Flex className="ph-no-capture" direction={'column'}>
              {CATEGORY_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    className="ph-no-capture"
                    onClick={() => {
                      posthog.capture(navItem.posthog);
                    }}
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
      {router.pathname === '/'}
      <Box pos="sticky" zIndex="sticky" top={0}>
        <Flex
          align="center"
          justify="space-between"
          display={{ base: 'flex', lg: 'none' }}
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
          </Flex>

          <MobileDrawer />
          <AbsoluteCenter>
            <Link
              as={NextLink}
              alignItems={'center'}
              _hover={{ textDecoration: 'none' }}
              href="/"
              onClick={() => {
                posthog.capture('homepage logo click_universal');
              }}
            >
              <Image
                h={5}
                cursor="pointer"
                objectFit={'contain'}
                alt={'Solar Earn'}
                src={'/assets/logo/logo.svg'}
              />
            </Link>
          </AbsoluteCenter>
          {status === 'authenticated' && session && <UserMenu />}
          {status === 'unauthenticated' && !session && (
            <Button
              className="ph-no-capture"
              mr={2}
              color="brand.purple"
              fontSize="md"
              onClick={() => {
                posthog.capture('login_navbar');
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
        display={{ base: 'flex', lg: 'none' }}
        px={{ base: 3, sm: 4 }}
        py={0}
        bg={'#F8FAFC'}
      >
        <Flex
          className="ph-no-capture"
          justify="space-evenly"
          gap={{ base: 8, sm: 8, md: 12 }}
          display={hideListingTypes ? 'none' : 'flex'}
          w="full"
          mx="auto"
          pl={1}
        >
          {LISTING_NAV_ITEMS?.map((navItem) => {
            const isCurrent = `${navItem.href}` === router.asPath;
            return (
              <NavLink
                onClick={() => {
                  posthog.capture(navItem.posthog);
                }}
                className="ph-no-capture"
                key={navItem.label}
                href={navItem.href ?? '#'}
                label={renderLabel(navItem)}
                isActive={isCurrent}
                fontSize={'sm'}
                fontWeight={500}
                borderBottom={'none'}
                h={'auto'}
                py={{ base: 2, md: 3 }}
              />
            );
          })}
        </Flex>
      </Flex>
    </>
  );
};
