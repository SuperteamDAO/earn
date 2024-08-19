import { Box, Container, Flex, HStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React, { type ReactNode, useEffect, useState } from 'react';

import { type Superteams } from '@/constants/Superteam';
import {
  CategoryBanner,
  HomeBanner,
  HomeSideBar,
  NavTabs,
  RegionBanner,
  totalsQuery,
  UserStatsBanner,
} from '@/features/home';
import { recentEarnersQuery } from '@/features/listings';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface HomeProps {
  children: ReactNode;
  type: 'home' | 'category' | 'region' | 'niche' | 'feed';
  st?: (typeof Superteams)[0];
}

type CategoryTypes = 'content' | 'development' | 'design' | 'other';

export function Home({ children, type, st }: HomeProps) {
  const router = useRouter();
  const [currentCategory, setCurrentCategory] = useState<CategoryTypes | null>(
    null,
  );

  const { data: totals, isLoading: isTotalsLoading } = useQuery(totalsQuery);

  const { data: recentEarners, isLoading: isEarnersLoading } =
    useQuery(recentEarnersQuery);

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

  const isTotalLoading = isTotalsLoading || isEarnersLoading;

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
      <Container maxW={'8xl'} mx="auto" px={{ base: 3, md: 4 }}>
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
              {type === 'home' && (
                <>
                  <NavTabs />
                  <HomeBanner userCount={totals?.totalUsers} />
                  <UserStatsBanner />
                </>
              )}
              {type === 'category' && <NavTabs />}
              {type === 'region' && <NavTabs mt={1} />}
              {children}
            </Box>
          </Flex>
          {type !== 'niche' && (
            <Flex
              display={{
                base: 'none',
                lg: 'flex',
              }}
            >
              <HomeSideBar
                type={type}
                isTotalLoading={isTotalLoading}
                total={totals?.totalInUSD ?? 0}
                listings={totals?.count ?? 0}
                earners={recentEarners ?? []}
              />
            </Flex>
          )}
        </HStack>
      </Container>
    </Default>
  );
}
