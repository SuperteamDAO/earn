/* eslint-disable no-nested-ternary */
import {
  Box,
  Container,
  Flex,
  HStack,
  Text,
  useMediaQuery,
  VStack,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Banner from '@/components/home/Banner';
import SideBar from '@/components/home/SideBar';
import SearchLoading from '@/components/Loading/searchLoading';
import {
  BountiesCard,
  CategoryBanner,
  GrantsCard,
  ListingSection,
} from '@/components/misc/listingsCard';
import type { Bounty } from '@/interface/bounty';
import type { Grant } from '@/interface/grant';
import type { Job } from '@/interface/job';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { TalentStore } from '@/store/talent';
import { fetchBasicInfo } from '@/utils/functions';

interface Listings {
  bounties?: Bounty[];
  grants?: Grant[];
  jobs?: Job[];
}

const Home: NextPage = () => {
  const router = useRouter();
  const { connected } = useWallet();
  const { talentInfo } = TalentStore();
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
    grants: [],
    jobs: [],
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get('/api/listings/');
      console.log('file: index.tsx:17 ~ getListings ~ listings:', listingsData);
      setListings(listingsData.data);
      setIsListingsLoading(false);
    } catch (e) {
      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isListingsLoading) return;
    getListings();
  }, []);

  const listingBasic = useQuery({
    queryFn: () => fetchBasicInfo(),
    queryKey: ['all', 'basic'],
  });

  const [isLessThan1200px] = useMediaQuery('(max-width: 1200px)');
  const [isLessThan850px] = useMediaQuery('(max-width: 850px)');
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const html = document.querySelector('html');
    try {
      if (isLessThan768px) {
        html!.style.fontSize = '100%';
      } else if (isLessThan850px) {
        html!.style.fontSize = '60%';
      } else if (isLessThan1200px) {
        html!.style.fontSize = '70%';
      } else {
        html!.style.fontSize = '100%';
      }
    } catch (error) {
      console.log(error);
    }
  }, [isLessThan1200px, isLessThan850px, isLessThan768px]);
  const listingsType = [
    'Design',
    'Growth',
    'Content',
    'Frontend Development',
    'Backend Development',
    'Contract Development',
  ];
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
        <HStack align="start" justify="space-between" mt={10}>
          <Flex w="full">
            {router.asPath.includes('search') ? (
              router.query.search && isListingsLoading ? (
                <SearchLoading />
              ) : (
                <Box>
                  <Flex gap={1} w={['full', 'full', '50rem', '50rem']}>
                    <Text color={'brand.slate.400'}>
                      Found{' '}
                      {(listings?.bounties?.length as number) +
                        (listings?.jobs?.length as number) +
                        (listings?.grants?.length as number)}{' '}
                      opportunities matching{' '}
                    </Text>
                    <Text
                      color={'brand.slate.700'}
                    >{`'${router.query.search}'`}</Text>
                  </Flex>
                  <VStack gap={5} mt={8}>
                    {listings?.bounties?.map((bounty) => {
                      return (
                        <BountiesCard
                          slug={bounty.slug}
                          status={bounty?.status}
                          rewardAmount={bounty?.rewardAmount}
                          key={bounty?.id}
                          sponsorName={bounty?.sponsor?.name}
                          deadline={bounty?.deadline}
                          title={bounty?.title}
                          logo={bounty?.sponsor?.logo}
                          token={bounty?.token}
                        />
                      );
                    })}

                    {listings?.grants?.map((grant) => {
                      return (
                        <GrantsCard
                          sponsorName={grant?.sponsor?.name}
                          logo={grant?.sponsor?.logo}
                          key={grant?.id}
                          rewardAmount={grant?.rewardAmount}
                          token={grant?.token}
                          title={grant?.title}
                        />
                      );
                    })}
                    {/* {listings?.jobs?.map((job) => {
                      return (
                        <JobsCard
                          logo={job?.sponsorInfo?.logo}
                          description={job?.jobs?.description}
                          max={job?.jobs?.maxSalary}
                          min={job?.jobs?.minSalary}
                          maxEq={job?.jobs?.maxEq}
                          minEq={job?.jobs?.minEq}
                          orgName={job?.sponsorInfo?.name}
                          key={job?.jobs?.id}
                          skills={JSON.parse(job?.jobs?.skills || '[]')}
                          title={job?.jobs?.title}
                        />
                      );
                    })} */}
                  </VStack>
                </Box>
              )
            ) : (
              <Box w={'100%'}>
                {connected ? (
                  <>
                    <HStack gap={1} w={'100%'} ml={5}>
                      <Text
                        color={'brand.slate.800'}
                        fontFamily={'Domine'}
                        fontSize={24}
                        fontWeight={700}
                      >
                        Welcome back,
                      </Text>

                      <Text
                        color={'brand.slate.800'}
                        fontFamily={'Domine'}
                        fontSize={24}
                        fontWeight={700}
                      >
                        {talentInfo?.firstname ?? 'Anon'}
                      </Text>
                    </HStack>
                  </>
                ) : (
                  <>
                    <Banner />
                  </>
                )}
                {router.asPath.includes('filter') && (
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

                <Box w={'100%'} mt={8}>
                  <ListingSection
                    type="bounties"
                    title="Active Bounties"
                    sub="Bite sized tasks for freelancers"
                    emoji="/assets/home/emojis/moneyman.png"
                  >
                    {listings?.bounties?.map((bounty) => {
                      return (
                        <BountiesCard
                          slug={bounty.slug}
                          status={bounty?.status}
                          rewardAmount={bounty?.rewardAmount}
                          key={bounty?.id}
                          sponsorName={bounty?.sponsor?.name}
                          deadline={bounty?.deadline}
                          title={bounty?.title}
                          logo={bounty?.sponsor?.logo}
                          token={bounty?.token}
                        />
                      );
                    })}
                  </ListingSection>

                  <ListingSection
                    type="grants"
                    title="Grants"
                    sub="Equity-free funding opportunities for builders"
                    emoji="/assets/home/emojis/grants.png"
                  >
                    {listings?.grants?.map((grant) => {
                      return (
                        <GrantsCard
                          sponsorName={grant?.sponsor?.name}
                          logo={grant?.sponsor?.logo}
                          key={grant?.id}
                          rewardAmount={grant?.rewardAmount}
                          token={grant?.token}
                          title={grant?.title}
                        />
                      );
                    })}
                  </ListingSection>
                  {/* <ListingSection
                    type="jobs"
                    title="Jobs"
                    sub="Join a high-growth team"
                    emoji="/assets/home/emojis/job.png"
                  >
                    {listings?.jobs?.slice(0, 10).map((job) => {
                      return (
                        <JobsCard
                          logo={job?.sponsorInfo?.logo}
                          description={job?.jobs?.description}
                          max={job?.jobs?.maxSalary}
                          min={job?.jobs?.minSalary}
                          maxEq={job?.jobs?.maxEq}
                          minEq={job?.jobs?.minEq}
                          orgName={job?.sponsorInfo?.name}
                          key={job?.jobs?.id}
                          skills={JSON.parse(job?.jobs?.skills || '[]')}
                          title={job?.jobs?.title}
                        />
                      );
                    })}
                  </ListingSection> */}
                </Box>
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
              total={listingBasic.data?.total ?? 0}
              listings={listingBasic.data?.count ?? 0}
              jobs={[]}
            />
          </Flex>
        </HStack>
      </Container>
    </Default>
  );
};

export default Home;
