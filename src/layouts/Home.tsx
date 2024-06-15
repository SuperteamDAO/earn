import { Box, Container, Flex, HStack } from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { type ReactNode, useEffect, useState } from 'react';

import { HomeBanner } from '@/components/home/Banner';
import { CategoryBanner } from '@/components/home/CategoryBanner';
import { NavTabs } from '@/components/home/NavTabs';
import { RegionBanner } from '@/components/home/RegionBanner';
import { HomeSideBar } from '@/components/home/SideBar';
import { UserStatsBanner } from '@/components/home/UserStatsBanner';
import { type Superteams } from '@/constants/Superteam';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface TotalType {
  count?: number;
  totalInUSD?: number;
  totalUsers?: number;
}
interface HomeProps {
  children: ReactNode;
  type: 'home' | 'category' | 'region' | 'niche' | 'feed';
  st?: (typeof Superteams)[0];
}

type CategoryTypes = 'content' | 'development' | 'design' | 'other';

export function Home({ children, type, st }: HomeProps) {
  const router = useRouter();

  const [isTotalLoading, setIsTotalLoading] = useState(true);
  const [recentEarners, setRecentEarners] = useState<User[]>([]);
  const [totals, setTotals] = useState<TotalType>({});
  const [currentCategory, setCurrentCategory] = useState<CategoryTypes | null>(
    null,
  );

  const getTotalInfo = async () => {
    try {
      const totalsData = await axios.get('/api/sidebar/totals');
      setTotals(totalsData.data);
      const earnerData = await axios.get('/api/sidebar/recentEarners');
      setRecentEarners(earnerData.data);
      setIsTotalLoading(false);
    } catch (e) {
      setIsTotalLoading(false);
    }
  };

  useEffect(() => {
    getTotalInfo();
  }, []);

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
  }, [router]);

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
            <Box w="full" pt={{ base: 3 }} pr={{ base: 0, lg: 6 }}>
              {type === 'home' && (
                <>
                  <NavTabs />
                  <HomeBanner userCount={totals.totalUsers} />
                  <UserStatsBanner />
                </>
              )}
              {type === 'category' && <NavTabs />}
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
