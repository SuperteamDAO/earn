import { Box, Flex, useMediaQuery } from '@chakra-ui/react';
import axios from 'axios';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';

import {
  BountiesCard,
  GrantsCard,
  ListingSection,
} from '@/components/misc/listingsCard';
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

const HomePage: NextPage = () => {
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
    <Home>
      <Box w={'100%'}>
        <ListingSection
          type="bounties"
          title="Active Bounties"
          sub="Bite sized tasks for freelancers"
          emoji="/assets/home/emojis/moneyman.png"
        >
          {isListingsLoading ? (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          ) : (
            listings?.bounties?.map((bounty) => {
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
            })
          )}
        </ListingSection>

        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.png"
        >
          {isListingsLoading ? (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          ) : (
            listings?.grants?.map((grant) => {
              return (
                <GrantsCard
                  sponsorName={grant?.sponsor?.name}
                  logo={grant?.sponsor?.logo}
                  key={grant?.id}
                  rewardAmount={grant?.rewardAmount}
                  token={grant?.token}
                  title={grant?.title}
                  link={grant?.link}
                />
              );
            })
          )}
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
    </Home>
  );
};

export default HomePage;
