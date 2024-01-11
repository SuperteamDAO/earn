import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import {
  BountiesCard,
  ListingsCardSkeleton,
  ListingSection,
} from '@/components/misc/listingsCard';
import { EmptySection } from '@/components/shared/EmptySection';
import type { Bounty } from '@/interface/bounty';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

interface Listings {
  bounties?: Bounty[];
}

function AllBountiesPage() {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
  });
  const date = dayjs().subtract(2, 'months').toISOString();

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          take: 100,
          type: 'open',
          deadline: date,
        },
      });
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
    <Home type="home">
      <Meta
        title="Superteam Earn | Discover Bounties and Grants in Crypto for Design, Development, and Content"
        description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
        canonical="https://earn.superteam.fun/bounties/"
      />

      <Box w={'100%'}>
        <ListingSection
          type="bounties"
          title="Bounties"
          sub="Competitive tasks where the best submissions win"
          emoji="/assets/home/emojis/moneyman.png"
          all
        >
          {isListingsLoading &&
            Array.from({ length: 8 }, (_, index) => (
              <ListingsCardSkeleton key={index} />
            ))}
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
                  applicationType={bounty.applicationType}
                  isWinnersAnnounced={bounty?.isWinnersAnnounced}
                />
              );
            })}
        </ListingSection>
      </Box>
    </Home>
  );
}

export default AllBountiesPage;
