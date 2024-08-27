import { Box, Container, Flex, HStack, Show } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React, { type ReactNode, useEffect, useState } from 'react';

import { type Superteams } from '@/constants/Superteam';
import {
  HomeBanner,
  HomeSideBar,
  NavTabs,
  UserStatsBanner,
} from '@/features/home';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface HomeProps {
  children: ReactNode;
  type: 'landing' | 'listing' | 'category' | 'region' | 'niche' | 'feed';
  st?: (typeof Superteams)[0];
  isAuth?: boolean;
}

type CategoryTypes = 'content' | 'development' | 'design' | 'other';

const RegionBanner = dynamic(() =>
  import('@/features/home').then((mod) => mod.RegionBanner),
);

const CategoryBanner = dynamic(() =>
  import('@/features/home').then((mod) => mod.CategoryBanner),
);

export function Home({ children, type, st, isAuth }: HomeProps) {
  const router = useRouter();
  const [currentCategory, setCurrentCategory] = useState<CategoryTypes | null>(
    null,
  );

  useEffect(() => {
    if (router.asPath.includes('/category/development/')) {
      setCurrentCategory('development');
    } else if (router.asPath.includes('/category/design/')) {
      setCurrentCategory('design');
    } else if (router.asPath.includes('/category/content/')) {
      setCurrentCategory('content');
    } else if (router.asPath.includes('/category/other/')) {
      setCurrentCategory('other');
    }
  }, [router.asPath]);

  const { data: session, status } = useSession();

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Superteam Earn | Work to Earn in Crypto"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      {type === 'region' && st && <RegionBanner st={st} />}
      {type === 'category' && currentCategory && (
        <CategoryBanner category={currentCategory} />
      )}
      <Box w="100%" mx="auto" px={{ base: '2', lg: 6 }}>
        <Container w="100%" maxW={'7xl'} mx="auto" p={0}>
          <HStack align="start" justify="space-between">
            <Flex
              w="full"
              py={4}
              borderRight={{
                base: 'none',
                lg: type === 'niche' ? 'none' : '1px solid',
              }}
              borderRightColor={{
                base: 'none',
                lg: 'blackAlpha.200',
              }}
            >
              <Box w="full" pt={1} pr={{ base: 0, lg: 6 }}>
                {type === 'landing' && (
                  <>
                    <NavTabs />
                    {isAuth ? <UserStatsBanner /> : <HomeBanner />}
                  </>
                )}
                {type === 'listing' && (
                  <>
                    <NavTabs />
                    {!session && status === 'unauthenticated' ? (
                      <HomeBanner />
                    ) : (
                      <UserStatsBanner />
                    )}
                  </>
                )}
                {type === 'category' && <NavTabs />}
                {type === 'region' && <NavTabs mt={1} />}
                {children}
              </Box>
            </Flex>
            <Show above="md">
              {type !== 'niche' && (
                <Flex
                  display={{
                    base: 'none',
                    lg: 'flex',
                  }}
                >
                  <HomeSideBar type={type} />
                </Flex>
              )}
            </Show>
          </HStack>
        </Container>
      </Box>
    </Default>
  );
}
