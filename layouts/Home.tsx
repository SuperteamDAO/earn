import { Box, Container, Flex, HStack } from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import React, { useEffect, useState } from 'react';

import Banner from '@/components/home/Banner';
import SideBar from '@/components/home/SideBar';
import SearchLoading from '@/components/Loading/searchLoading';
import { CategoryBanner } from '@/components/misc/listingsCard';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

type IDefaultProps = {
  children: ReactNode;
};

interface TotalType {
  total?: number;
  count?: number;
  totalInUSD?: number;
}

interface SidebarType {
  totals?: TotalType;
  earners?: User[];
}

const listingsType = [
  'Design',
  'Growth',
  'Content',
  'Frontend Development',
  'Backend Development',
  'Contract Development',
];

function Home(props: IDefaultProps) {
  const router = useRouter();
  const { userInfo } = userStore();
  const [isTotalLoading, setIsTotalLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showCategoryBanner, setShowCategoryBanner] = useState(false);

  const [sidebarInfo, setSidebarInfo] = useState<SidebarType>({});

  const getTotalInfo = async () => {
    setIsTotalLoading(true);
    try {
      const aggregatesData = await axios.get('/api/sidebar/');
      setSidebarInfo(aggregatesData.data);
      setIsTotalLoading(false);
    } catch (e) {
      setIsTotalLoading(false);
    }
  };

  useEffect(() => {
    if (!isTotalLoading) return;
    getTotalInfo();
  }, []);

  useEffect(() => {
    if (router.asPath.includes('search') && router.query.search) {
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }

    if (router.asPath.includes('filter')) {
      setShowCategoryBanner(true);
    } else {
      setShowCategoryBanner(false);
    }
  }, [router.asPath, router.query]);

  return (
    <Default
      meta={
        <Meta
          title="Superteam Earn"
          description="Every Solana opportunity in one place!"
        />
      }
    >
      <Container maxW={'7xl'} mx="auto">
        <HStack align="start" justify="space-between" mt={12}>
          <Flex
            w="full"
            pr={6}
            borderRight="1px solid"
            borderRightColor={'blackAlpha.200'}
          >
            {showSearch ? (
              <SearchLoading />
            ) : (
              <Box w="full">
                {!userInfo?.id && <Banner />}
                {showCategoryBanner && (
                  <CategoryBanner
                    type={
                      listingsType.find((type) =>
                        type
                          .toLocaleLowerCase()
                          .includes(router.query.filter as string)
                      ) as string
                    }
                  />
                )}
                {props.children}
              </Box>
            )}
          </Flex>
          <Flex
            display={{
              base: 'none',
              lg: 'flex',
            }}
          >
            <SideBar
              total={sidebarInfo?.totals?.totalInUSD ?? 0}
              listings={sidebarInfo?.totals?.count ?? 0}
              earners={sidebarInfo?.earners ?? []}
              jobs={[]}
            />
          </Flex>
        </HStack>
      </Container>
    </Default>
  );
}

export default Home;
