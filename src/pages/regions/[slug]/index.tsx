import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import type { NextPageContext } from 'next';
import React, { useEffect, useState } from 'react';

import {
  GrantsCard,
  ListingCard,
  ListingsCardSkeleton,
  ListingSection,
} from '@/components/misc/listingsCard';
import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import { Superteams } from '@/constants/Superteam';
import type { Bounty } from '@/interface/bounty';
import type { Grant } from '@/interface/grant';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

interface Listings {
  bounties?: Bounty[];
  grants?: Grant[];
}
const RegionsPage = ({
  slug,
  displayName,
}: {
  slug: string;
  displayName: string;
}) => {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
    grants: [],
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get(
        `/api/listings/regions/?region=${slug}`,
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

  return (
    <>
      <Home type="region">
        <Meta
          title={`Welcome to Superteam Earn ${displayName} | Discover Bounties and Grants`}
          description={`Welcome to Superteam ${displayName}'s page — Discover bounties and grants and become a part of the global crypto community`}
          canonical={`https://earn.superteam.fun/regions/${slug}/`}
        ></Meta>
        <Box w={'100%'}>
          <ListingSection
            type="bounties"
            title="Freelance Gigs"
            sub="Bite sized tasks for freelancers"
            emoji="/assets/home/emojis/moneyman.png"
            url={`/regions/${slug}/bounties`}
            all
          >
            {isListingsLoading &&
              Array.from({ length: 8 }, (_, index) => (
                <ListingsCardSkeleton key={index} />
              ))}
            {!isListingsLoading && !listings?.bounties?.length && (
              <Flex align="center" justify="center" mt={8}>
                <EmptySection
                  title="No listings available!"
                  message="Subscribe to notifications to get notified about new bounties."
                />
              </Flex>
            )}
            {!isListingsLoading &&
              listings?.bounties?.map((bounty) => {
                return <ListingCard key={bounty.id} bounty={bounty} />;
              })}
          </ListingSection>

          <ListingSection
            type="grants"
            title="Grants"
            sub="Equity-free funding opportunities for builders"
            emoji="/assets/home/emojis/grants.png"
            all
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
        </Box>
      </Home>
    </>
  );
};

export async function getServerSideProps(context: NextPageContext) {
  const { slug } = context.query;

  const st = Superteams.find((team) => team.region.toLowerCase() === slug);
  const displayName = st?.displayValue;

  const validRegion = Superteams.some(
    (team) => team.region.toLowerCase() === (slug as string).toLowerCase(),
  );

  if (!validRegion) {
    return {
      notFound: true,
    };
  }

  return {
    props: { slug, displayName },
  };
}

export default RegionsPage;
