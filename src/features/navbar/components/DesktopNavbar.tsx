import {
  AbsoluteCenter,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Image,
  Link,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Text,
} from '@chakra-ui/react';
import { SearchIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { LISTING_NAV_ITEMS } from '../constants';
import { NavLink } from './NavLink';

interface Props {
  onLoginOpen: () => void;
  onSearchOpen: () => void;
}

const UserMenu = dynamic(() =>
  import('./UserMenu').then((mod) => mod.UserMenu),
);

const LogoContextMenu = dynamic(() =>
  import('./LogoContextMenu').then((mod) => mod.LogoContextMenu),
);

export const DesktopNavbar = ({ onLoginOpen, onSearchOpen }: Props) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();

  const isDashboardRoute = router.pathname.startsWith('/dashboard');
  const maxWValue = isDashboardRoute ? '' : '7xl';
  const { t } = useTranslation('common');

  return (
    <Flex
      display={{ base: 'none', lg: 'flex' }}
      px={{ base: '2', lg: 6 }}
      color="brand.slate.500"
      bg="white"
      borderBottom="1px solid"
      borderBottomColor="blackAlpha.200"
    >
      <Flex justify={'space-between'} w="100%" maxW={maxWValue} mx="auto">
        <Flex align="center" gap={{ base: 3, lg: 6 }}>
          <LogoContextMenu>
            <Link
              as={NextLink}
              alignItems={'center'}
              gap={3}
              display={'flex'}
              mr={5}
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

              {isDashboardRoute && (
                <>
                  <Divider
                    w={'3px'}
                    h={'24px'}
                    borderColor={'brand.slate.400'}
                    orientation="vertical"
                  />
                  <Text fontSize="sm" letterSpacing={'1.5px'}>
                    {t('desktopNavbar.sponsors')}
                  </Text>
                </>
              )}
            </Link>
          </LogoContextMenu>

          {router.pathname !== '/search' && (
            <Button
              className="ph-no-capture"
              gap={2}
              color="brand.slate.400"
              fontWeight={400}
              border={'none'}
              borderColor={'brand.slate.300'}
              _hover={{
                bg: 'brand.slate.100',
              }}
              aria-label={t('desktopNavbar.search')}
              onClick={onSearchOpen}
              variant="outline"
            >
              <SearchIcon />
            </Button>
          )}
        </Flex>
        <AbsoluteCenter>
          <Flex align="center" justify={'center'} flexGrow={1} h="full" ml={10}>
            <Stack
              className="ph-no-capture"
              direction={'row'}
              h="full"
              spacing={7}
            >
              {LISTING_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    className="ph-no-capture"
                    onClick={() => {
                      posthog.capture(navItem.posthog);
                    }}
                    key={navItem.label}
                    href={navItem.href ?? '#'}
                    label={t(navItem.label)}
                    isActive={isCurrent}
                  />
                );
              })}
              {/* {HACKATHON_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    onClick={() => {
                      posthog.capture(navItem.posthog);
                    }}
                    key={navItem.label}
                    href={navItem.href ?? '#'}
                    label={renderLabel(navItem)}
                    isActive={isCurrent}
                  />
                );
              })} */}
            </Stack>
          </Flex>
        </AbsoluteCenter>

        <Stack
          align="center"
          justify={'flex-end'}
          direction={'row'}
          flex={1}
          py={2}
          spacing={4}
        >
          {status === 'loading' && !session && (
            <Flex align={'center'} gap={2}>
              <SkeletonCircle size="10" />
              <SkeletonText w={'80px'} noOfLines={1} />
            </Flex>
          )}

          {status === 'authenticated' && session && <UserMenu />}

          {status === 'unauthenticated' && !session && (
            <HStack className="ph-no-capture" gap={2}>
              <HStack gap={0}>
                <Button
                  fontSize="xs"
                  onClick={() => {
                    posthog.capture('create a listing_navbar');
                    router.push('/sponsor');
                  }}
                  size="sm"
                  variant={'ghost'}
                >
                  {t('desktopNavbar.becomeASponsor')}
                  <Box
                    display="block"
                    w={1.5}
                    h={1.5}
                    ml={1.5}
                    bg="#38BDF8"
                    rounded="full"
                  />
                </Button>
                <Button
                  fontSize="xs"
                  onClick={() => {
                    posthog.capture('login_navbar');
                    onLoginOpen();
                  }}
                  size="sm"
                  variant={'ghost'}
                >
                  {t('desktopNavbar.login')}
                </Button>
              </HStack>
              <Button
                w={'100%'}
                my={1}
                px={4}
                fontSize="xs"
                onClick={() => {
                  posthog.capture('signup_navbar');
                  onLoginOpen();
                }}
                size="sm"
                variant="solid"
              >
                {t('desktopNavbar.signUp')}
              </Button>
            </HStack>
          )}
        </Stack>
      </Flex>
    </Flex>
  );
};
