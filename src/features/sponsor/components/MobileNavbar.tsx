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
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useRef } from 'react';

import { UserMenu } from '@/features/navbar';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';

import { NAV_LINKS } from '../utils';

export const MobileNavbar = () => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { data: session, status } = useSession();

  const { user } = useUser();

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
                <Link
                  className="ph-no-capture"
                  as={NextLink}
                  href="/new/sponsor/"
                  onClick={() => posthog.capture('login_navbar')}
                >
                  <Button
                    color="brand.slate.500"
                    fontSize="md"
                    size="md"
                    variant="unstyled"
                  >
                    Login
                  </Button>
                </Link>
                <Divider
                  h={5}
                  borderWidth={'0.5px'}
                  borderColor={'brand.slate.300'}
                  orientation="vertical"
                />
                <Link
                  className="ph-no-capture"
                  as={NextLink}
                  href="/new/sponsor/"
                  onClick={() => posthog.capture('get started_sponsor navbar')}
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
                </Link>
              </Flex>
            )}

            {user && !user.currentSponsorId && (
              <Link
                className="ph-no-capture"
                as={NextLink}
                href="/new/sponsor/"
                onClick={() => posthog.capture('get started_sponsor navbar')}
              >
                <Button
                  color={'brand.purple'}
                  fontSize="md"
                  size="md"
                  variant="unstyled"
                >
                  Get Started
                </Button>
              </Link>
            )}

            {user && !!user.currentSponsorId && (
              <Link
                className="ph-no-capture"
                as={NextLink}
                href="/dashboard/listings/?open=1"
                onClick={() =>
                  posthog.capture('create a listing_sponsor navbar')
                }
              >
                <Button
                  color={'brand.purple'}
                  fontSize="md"
                  size="md"
                  variant="unstyled"
                >
                  Create a Listing
                </Button>
              </Link>
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
          onClick={() => {
            posthog.capture('homepage logo click_universal');
          }}
        >
          <Image
            h={5}
            cursor="pointer"
            objectFit={'contain'}
            alt={'Superteam Earn'}
            src={'/assets/logo.svg'}
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
        <Link
          className="ph-no-capture"
          as={NextLink}
          href="/new/sponsor/"
          onClick={() => posthog.capture('login_navbar')}
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
        </Link>
      )}
    </Flex>
  );
};
