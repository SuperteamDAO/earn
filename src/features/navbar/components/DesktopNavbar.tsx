import {
  AbsoluteCenter,
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
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React from 'react';

import {
  CATEGORY_NAV_ITEMS,
  HACKATHON_NAV_ITEMS,
  LISTING_NAV_ITEMS,
  renderLabel,
} from '../constants';
import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';

export const DesktopNavbar = ({ onLoginOpen }: { onLoginOpen: () => void }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isDashboardRoute = router.pathname.startsWith('/dashboard');
  const maxWValue = isDashboardRoute ? '' : '7xl';

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
        <Flex align="center" gap={6}>
          <Link
            as={NextLink}
            alignItems={'center'}
            gap={3}
            display={'flex'}
            mr={5}
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

            {isDashboardRoute && (
              <>
                <Divider
                  w={'3px'}
                  h={'24px'}
                  borderColor={'brand.slate.400'}
                  orientation="vertical"
                />
                <Text fontSize="sm" letterSpacing={'1.5px'}>
                  SPONSORS
                </Text>
              </>
            )}
          </Link>

          {LISTING_NAV_ITEMS?.map((navItem) => {
            const isCurrent = `${navItem.href}` === router.asPath;
            return (
              <NavLink
                key={navItem.label}
                href={navItem.href ?? '#'}
                label={navItem.label}
                isActive={isCurrent}
              />
            );
          })}
        </Flex>
        <AbsoluteCenter>
          <Flex align="center" justify={'center'} flexGrow={1} h="full" ml={10}>
            <Stack direction={'row'} h="full" spacing={7}>
              {CATEGORY_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    href={navItem.href ?? '#'}
                    label={navItem.label}
                    isActive={isCurrent}
                    key={navItem.label}
                  />
                );
              })}
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
            <HStack gap={2}>
              <HStack gap={0}>
                <Button
                  color="#6366F1"
                  fontSize="xs"
                  bg={'white'}
                  onClick={() => {
                    router.push('/sponsor');
                  }}
                  size="sm"
                >
                  Create A Listing
                </Button>
                <Button
                  fontSize="xs"
                  onClick={() => {
                    onLoginOpen();
                  }}
                  size="sm"
                  variant={'ghost'}
                >
                  Login
                </Button>
              </HStack>
              <Button
                w={'100%'}
                my={1}
                px={4}
                fontSize="xs"
                onClick={() => {
                  onLoginOpen();
                }}
                size="sm"
                variant="solid"
              >
                Sign Up
              </Button>
            </HStack>
          )}
        </Stack>
      </Flex>
    </Flex>
  );
};
