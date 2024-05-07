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
import { usePostHog } from 'posthog-js/react';
import React from 'react';

import { UserMenu } from '@/components/shared/UserMenu';
import { userStore } from '@/store/user';

import { NAV_LINKS } from '../utils';

export const DesktopNavbar = () => {
  const { data: session, status } = useSession();

  const { userInfo } = userStore();

  const posthog = usePostHog();

  const router = useRouter();

  const isDashboardRoute = router.pathname.startsWith('/dashboard');
  const maxWValue = isDashboardRoute ? '' : '8xl';

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
        </Flex>
        <AbsoluteCenter>
          <Flex align="center" justify={'center'} flexGrow={1} h="full" ml={10}>
            <Stack direction={'row'} h="full" spacing={7}>
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

          <HStack gap={2}>
            <HStack gap={0}>
              {status === 'authenticated' && !!userInfo?.currentSponsorId && (
                <NextLink
                  href="/dashboard/listings/?open=1"
                  className="ph-no-capture"
                  onClick={() => posthog.capture('clicked_nav_create_listing')}
                >
                  <Button
                    color="#4F46E5"
                    fontWeight={600}
                    bg={'white'}
                    size="sm"
                  >
                    Create a Listing
                  </Button>
                </NextLink>
              )}
              {status === 'authenticated' && !userInfo?.currentSponsorId && (
                <NextLink
                  href="/new/sponsor/"
                  className="ph-no-capture"
                  onClick={() => posthog.capture('clicked_nav_get_started')}
                >
                  <Button
                    color="#4F46E5"
                    fontWeight={600}
                    bg={'white'}
                    size="sm"
                  >
                    Get Started
                  </Button>
                </NextLink>
              )}
              {status === 'authenticated' && session && <UserMenu />}
            </HStack>
          </HStack>

          {status === 'unauthenticated' && !session && (
            <HStack gap={2}>
              <HStack gap={0}>
                <NextLink
                  href="/new/sponsor/"
                  className="ph-no-capture"
                  onClick={() => posthog.capture('clicked_nav_login')}
                >
                  <Button fontSize="xs" size="sm" variant={'ghost'}>
                    Login
                  </Button>
                </NextLink>
                <NextLink
                  href="/new/sponsor/"
                  className="ph-no-capture"
                  onClick={() => posthog.capture('clicked_nav_get_started')}
                >
                  <Button
                    color="#4F46E5"
                    fontWeight={600}
                    bg={'white'}
                    size="sm"
                  >
                    Get Started
                  </Button>
                </NextLink>
              </HStack>
            </HStack>
          )}
        </Stack>
      </Flex>
    </Flex>
  );
};
