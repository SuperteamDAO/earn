import { HamburgerIcon } from '@chakra-ui/icons';
import {
  AbsoluteCenter,
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
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useRef } from 'react';

import { UserMenu } from '@/components/shared/UserMenu';
import { userStore } from '@/store/user';

import { NAV_LINKS } from '../utils';

export const MobileNavbar = () => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { data: session, status } = useSession();

  const { userInfo } = userStore();

  const posthog = usePostHog();

  const btnRef = useRef<HTMLButtonElement>(null);

  const MobileDrawer = () => {
    return (
      <Drawer
        finalFocusRef={btnRef}
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        placement="left"
      >
        <DrawerOverlay display={{ base: 'block', lg: 'none' }} />
        <DrawerContent display={{ base: 'block', lg: 'none' }}>
          <Flex px={3} py={2}>
            <CloseButton onClick={onDrawerClose} />
          </Flex>
          <DrawerBody>
            {status === 'unauthenticated' && !session && (
              <Flex align="center" gap={3}>
                <NextLink
                  href="/new/sponsor/"
                  className="ph-no-capture"
                  onClick={() => posthog.capture('clicked_nav_login')}
                >
                  <Button
                    color="brand.slate.500"
                    fontSize="md"
                    size="md"
                    variant="unstyled"
                  >
                    Login
                  </Button>
                </NextLink>
                <Divider
                  h={5}
                  borderWidth={'0.5px'}
                  borderColor={'brand.slate.300'}
                  orientation="vertical"
                />
                <NextLink
                  href="/new/sponsor/"
                  className="ph-no-capture"
                  onClick={() => posthog.capture('clicked_nav_get_started')}
                >
                  <Button
                    color="#4F46E5"
                    fontWeight={600}
                    bg={'white'}
                    size="md"
                    variant="unstyled"
                  >
                    Get Started
                  </Button>
                </NextLink>
              </Flex>
            )}

            {userInfo && !userInfo.currentSponsorId && (
              <NextLink
                href="/new/sponsor/"
                className="ph-no-capture"
                onClick={() => posthog.capture('clicked_nav_get_started')}
              >
                <Button
                  color={'brand.purple'}
                  fontSize="md"
                  size="md"
                  variant="unstyled"
                >
                  Get Started
                </Button>
              </NextLink>
            )}

            {userInfo && !!userInfo.currentSponsorId && (
              <NextLink
                href="/dashboard/listings/?open=1"
                className="ph-no-capture"
                onClick={() => posthog.capture('clicked_nav_create_listing')}
              >
                <Button
                  color={'brand.purple'}
                  fontSize="md"
                  size="md"
                  variant="unstyled"
                >
                  Create a Listing
                </Button>
              </NextLink>
            )}

            <Flex direction={'column'}>
              {NAV_LINKS?.map((navItem) => {
                return (
                  <Link
                    key={navItem.label}
                    alignItems={'center'}
                    display={'flex'}
                    h={{ base: '8', lg: 14 }}
                    py={2}
                    color="brand.slate.500"
                    fontSize={{ base: 'lg', lg: 'sm' }}
                    fontWeight={500}
                    _hover={{
                      textDecoration: 'none',
                      color: 'brand.slate.600',
                    }}
                    href={navItem.link ?? '#'}
                  >
                    {navItem.label}
                  </Link>
                );
              })}
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  };

  return (
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
      <IconButton
        ref={btnRef}
        bg="transparent"
        _hover={{ bg: 'transparent' }}
        _active={{ bg: 'transparent' }}
        aria-label="Open Drawer"
        icon={<HamburgerIcon h={6} w={6} color="brand.slate.500" />}
        onClick={onDrawerOpen}
      />
      <MobileDrawer />
      <AbsoluteCenter>
        <Link
          as={NextLink}
          alignItems={'center'}
          gap={3}
          display={'flex'}
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
          <>
            <Divider
              w={'3px'}
              h={'24px'}
              borderColor={'brand.slate.400'}
              orientation="vertical"
            />
            <Text
              color={'brand.slate.500'}
              fontSize="sm"
              fontWeight={600}
              letterSpacing={'1.5px'}
            >
              SPONSORS
            </Text>
          </>
        </Link>
      </AbsoluteCenter>
      {status === 'authenticated' && session && <UserMenu />}
      {status === 'unauthenticated' && !session && (
        <NextLink
          href="/new/sponsor/"
          className="ph-no-capture"
          onClick={() => posthog.capture('clicked_nav_login')}
        >
          <Button
            mr={2}
            color="brand.purple"
            fontSize="md"
            size="sm"
            variant="unstyled"
          >
            Login
          </Button>
        </NextLink>
      )}
    </Flex>
  );
};
