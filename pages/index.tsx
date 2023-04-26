/* eslint-disable no-nested-ternary */
import {
  Box,
  Flex,
  HStack,
  Text,
  useMediaQuery,
  VStack,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import type { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Banner from '@/components/home/Banner';
import SideBar from '@/components/home/SideBar';
import SearchLoading from '@/components/Loading/searchLoading';
import {
  BountiesCard,
  CategoryBanner,
  GrantsCard,
  JobsCard,
  ListingSection,
} from '@/components/misc/listingsCard';
import type { BountyStatus } from '@/interface/types';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { TalentStore } from '@/store/talent';
import { fetchAll, fetchBasicInfo } from '@/utils/functions';

const Home: NextPage = () => {
  const router = useRouter();
  const { connected } = useWallet();
  const { talentInfo } = TalentStore();
  const listings = useQuery(
    ['all', 'listings', router.query.search ?? '', router.query.filter ?? ''],
    ({ queryKey }) => fetchAll(queryKey[2] as string, queryKey[3] as string)
  );
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
      <Flex
        justify={'center'}
        w={'100%'}
        h={'max-content'}
        minH={'100vh'}
        pt={'3.5rem'}
        bg={'white'}
      >
        {router.asPath.includes('search') ? (
          router.query.search && listings.isLoading ? (
            <SearchLoading />
          ) : (
            <Box>
              <Flex gap={1} w={['full', 'full', '50rem', '50rem']}>
                <Text color={'brand.slate.400'}>
                  Found{' '}
                  {(listings.data?.bounty.length as number) +
                    (listings.data?.jobs.length as number) +
                    (listings.data?.grants.length as number)}{' '}
                  opportunities matching{' '}
                </Text>
                <Text
                  color={'brand.slate.700'}
                >{`'${router.query.search}'`}</Text>
              </Flex>
              <VStack gap={5} mt={8}>
                {listings.data?.bounty?.map((bounty) => {
                  return (
                    <BountiesCard
                      slug={bounty?.bounty.slug as string}
                      status={bounty?.bounty?.status as BountyStatus}
                      amount={bounty?.bounty?.amount}
                      key={bounty?.bounty?.id}
                      sponsor={bounty?.sponsorInfo?.name}
                      due={bounty?.bounty?.deadline}
                      title={bounty?.bounty?.title}
                      logo={bounty?.sponsorInfo?.logo}
                      token={bounty?.bounty?.token}
                    />
                  );
                })}

                {listings.data?.jobs?.map((job) => {
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

                {listings.data?.grants?.map((grant) => {
                  return (
                    <GrantsCard
                      sponsor={grant?.sponsorInfo?.name}
                      logo={grant?.sponsorInfo?.logo}
                      key={grant?.grants?.id}
                      max={grant?.grants?.maxSalary}
                      title={grant?.grants?.title}
                      min={grant?.grants?.minSalary}
                    />
                  );
                })}
              </VStack>
            </Box>
          )
        ) : (
          <Box>
            {connected ? (
              <>
                <HStack gap={1}>
                  <Text
                    color={'brand.slate.800'}
                    fontFamily={'Domine'}
                    fontSize={7}
                    fontWeight={700}
                  >
                    Welcome back,
                  </Text>

                  <Text
                    color={'brand.slate.800'}
                    fontFamily={'Domine'}
                    fontSize={7}
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
            <Box mt={8}>
              <ListingSection
                type="bounties"
                title="Active Bounties"
                sub="Bite sized tasks for freelancers"
                emoji="/assets/home/emojis/moneyman.png"
              >
                {listings.data?.bounty?.map((bounty) => {
                  return (
                    <BountiesCard
                      slug={bounty?.bounty.slug as string}
                      status={bounty?.bounty?.status as BountyStatus}
                      amount={bounty?.bounty?.amount}
                      key={bounty?.bounty?.id}
                      sponsor={bounty?.sponsorInfo?.name}
                      due={bounty?.bounty?.deadline}
                      title={bounty?.bounty?.title}
                      logo={bounty?.sponsorInfo?.logo}
                      token={bounty?.bounty?.token}
                    />
                  );
                })}
              </ListingSection>
              <ListingSection
                type="jobs"
                title="Jobs"
                sub="Join a high-growth team"
                emoji="/assets/home/emojis/job.png"
              >
                {listings.data?.jobs?.slice(0, 10).map((job) => {
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
              </ListingSection>
              <ListingSection
                type="grants"
                title="Grants"
                sub="Equity-free funding opportunities for builders"
                emoji="/assets/home/emojis/grants.png"
              >
                {listings.data?.grants?.map((grant) => {
                  return (
                    <GrantsCard
                      sponsor={grant?.sponsorInfo?.name}
                      logo={grant?.sponsorInfo?.logo}
                      key={grant?.grants?.id}
                      max={grant?.grants?.maxSalary}
                      title={grant?.grants?.title}
                      min={grant?.grants?.minSalary}
                    />
                  );
                })}
              </ListingSection>
            </Box>
          </Box>
        )}
        {!isLessThan768px && (
          <SideBar
            total={listingBasic.data?.total ?? 0}
            listings={listingBasic.data?.count ?? 0}
            jobs={listings.data?.jobs.slice(0, 10)}
          />
        )}
      </Flex>
    </Default>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();

  const { query } = context;

  try {
    await queryClient.prefetchQuery(['all', 'listings'], () =>
      fetchAll(query.search as string, query.filter as string)
    );
  } catch (error) {
    console.log(error);
  }
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};

export default Home;
