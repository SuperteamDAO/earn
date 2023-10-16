import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import { BountiesCard, ListingSection } from '@/components/misc/listingsCard';
import EmptySection from '@/components/shared/EmptySection';
import Loading from '@/components/shared/Loading';
import type { Bounty } from '@/interface/bounty';
import type { Grant } from '@/interface/grant';
import Home from '@/layouts/Home';

interface Listings {
  bounties?: Bounty[];
  grants?: Grant[];
}

interface Props {
  slug: string;
}

function AllBountybyCountry({ slug }: Props) {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
    grants: [],
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
      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isListingsLoading) return;
    getListings();
  }, []);

  return (
    <Home type="region">
      <Box w={'100%'}>
        <ListingSection
          type="bounties"
          title="Bounties"
          sub="Bite sized tasks for freelancers"
          emoji="/assets/home/emojis/moneyman.png"
        >
          {isListingsLoading && (
            <Flex align="center" justify="center" direction="column" minH={52}>
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
                  slug={bounty?.slug}
                  rewardAmount={bounty?.rewardAmount}
                  key={bounty?.id}
                  sponsorName={bounty?.sponsor?.name}
                  deadline={bounty?.deadline}
                  title={bounty?.title}
                  logo={bounty?.sponsor?.logo}
                  token={bounty?.token}
                  type={bounty?.type}
                  applicationType={bounty?.applicationType}
                />
              );
            })}
        </ListingSection>
      </Box>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.params) {
    return { props: {} };
  }
  const { slug } = context.params;

  return {
    props: { slug },
  };
};

export default AllBountybyCountry;
