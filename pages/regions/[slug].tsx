import { Box, Flex, useMediaQuery } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import React, { useEffect, useState } from 'react';

import {
  BountiesCard,
  GrantsCard,
  JobsCard,
  ListingSection,
} from '@/components/misc/listingsCard';
import EmptySection from '@/components/shared/EmptySection';
import Loading from '@/components/shared/Loading';
import type { Bounty } from '@/interface/bounty';
import type { Grant } from '@/interface/grant';
import type { Job } from '@/interface/job';
import Home from '@/layouts/Home';
import { Mixpanel } from '@/utils/mixpanel';

interface Listings {
  bounties?: Bounty[];
  grants?: Grant[];
  jobs?: Job[];
}
const RegionsPage = ({ slug }: { slug: string }) => {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
    grants: [],
    jobs: [],
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get(
        `/api/listings/regions/?region=${slug}`
      );
      setListings(listingsData.data);
      setIsListingsLoading(false);
    } catch (e) {
      console.log(e);

      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isListingsLoading) return;
    getListings();
  }, []);

  const [isLessThan1200px] = useMediaQuery('(max-width: 1200px)');
  const [isLessThan850px] = useMediaQuery('(max-width: 850px)');
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const html = document.querySelector('html');
    Mixpanel.track('home_page_load');
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
  return (
    <>
      <Home>
        <Box w={'100%'}>
          <ListingSection
            type="bounties"
            title="Active Bounties"
            sub="Bite sized tasks for freelancers"
            emoji="/assets/home/emojis/moneyman.png"
          >
            {isListingsLoading && (
              <Flex
                align="center"
                justify="center"
                direction="column"
                minH={52}
              >
                <Loading />
              </Flex>
            )}
            {!isListingsLoading && !listings?.bounties?.length && (
              <Flex align="center" justify="center" mt={8}>
                <EmptySection
                  title="No bounties available!"
                  message="Subscribe to notifications to get notified about new bounties."
                />
              </Flex>
            )}
            {!isListingsLoading &&
              listings?.bounties?.map((bounty) => {
                return (
                  <BountiesCard
                    slug={bounty.slug}
                    rewardAmount={bounty?.rewardAmount}
                    key={bounty?.id}
                    sponsorName={bounty?.sponsor?.name}
                    deadline={bounty?.deadline}
                    title={bounty?.title}
                    logo={bounty?.sponsor?.logo}
                    token={bounty?.token}
                    type={bounty?.type}
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
            {isListingsLoading && (
              <Flex
                align="center"
                justify="center"
                direction="column"
                minH={52}
              >
                <Loading />
              </Flex>
            )}
            {!isListingsLoading && !listings?.grants?.length && (
              <Flex align="center" justify="center" mt={8}>
                <EmptySection
                  title="No grants available!"
                  message="Subscribe to notifications to get notified about new grants."
                />
              </Flex>
            )}
            {!isListingsLoading &&
              listings?.grants?.map((grant) => {
                return (
                  <GrantsCard
                    sponsorName={grant?.sponsor?.name}
                    logo={grant?.sponsor?.logo}
                    key={grant?.id}
                    slug={grant.slug}
                    rewardAmount={grant?.rewardAmount}
                    title={grant?.title}
                    short_description={grant?.shortDescription}
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
            {isListingsLoading && (
              <Flex
                align="center"
                justify="center"
                direction="column"
                minH={52}
              >
                <Loading />
              </Flex>
            )}
            {!isListingsLoading && !listings?.jobs?.length && (
              <Flex align="center" justify="center" mt={8}>
                <EmptySection
                  title="No jobs available!"
                  message="Subscribe to notifications to get notified about new jobs."
                />
              </Flex>
            )}
            {!isListingsLoading &&
              listings?.jobs?.map((job) => {
                return (
                  <JobsCard
                    key={job?.id}
                    logo={job?.sponsor?.logo}
                    location={job?.location || ''}
                    orgName={job?.sponsor?.name || ''}
                    skills={job?.skills || ''}
                    title={job?.title || ''}
                    link={job?.link || ''}
                  />
                );
              })}
          </ListingSection>
        </Box>
      </Home>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: {
      slug,
    },
  };
};
export default RegionsPage;
