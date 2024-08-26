import { Box, Flex } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { getServerSession } from 'next-auth';
import { useEffect, useState } from 'react';

import { CombinedRegions } from '@/constants/Superteam';
import { homepageGrantsQuery, homepageListingsQuery } from '@/features/home';
import { type Listing, ListingSection, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';

import { authOptions } from './api/auth/[...nextauth]';
import { getListings } from './api/homepage/listings';

interface Props {
  listings: Listing[];
  isAuth: boolean;
  userRegion: Regions[] | null;
}

const InstallPWAModal = dynamic(
  () =>
    import('@/components/modals/InstallPWAModal').then(
      (mod) => mod.InstallPWAModal,
    ),
  { ssr: false },
);

const GrantsCard = dynamic(
  () => import('@/features/grants').then((mod) => mod.GrantsCard),
  { ssr: false },
);

const EmptySection = dynamic(
  () =>
    import('@/components/shared/EmptySection').then((mod) => mod.EmptySection),
  { ssr: false },
);

export default function HomePage({ listings, isAuth, userRegion }: Props) {
  const [combinedListings, setCombinedListings] = useState(listings);

  const { data: reviewListings } = useQuery(
    homepageListingsQuery({
      order: 'desc',
      statusFilter: 'review',
      userRegion,
    }),
  );

  const { data: completeListings } = useQuery(
    homepageListingsQuery({
      order: 'desc',
      statusFilter: 'completed',
      userRegion,
    }),
  );

  const { data: grants } = useQuery(homepageGrantsQuery(userRegion));

  useEffect(() => {
    if (reviewListings && completeListings) {
      setCombinedListings([
        ...listings,
        ...reviewListings,
        ...completeListings,
      ]);
    }
  }, [reviewListings, listings]);

  return (
    <Home type="landing" isAuth={isAuth}>
      <InstallPWAModal />
      <Box w={'100%'}>
        <ListingTabs
          bounties={combinedListings}
          isListingsLoading={false}
          emoji="/assets/home/emojis/moneyman.png"
          title="Freelance Gigs"
          viewAllLink="/all"
          take={20}
          showViewAll
        />
        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.png"
          showViewAll
        >
          {!grants?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No grants available!"
                message="Subscribe to notifications to get notified about new grants."
              />
            </Flex>
          )}
          {grants &&
            grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
            })}
        </ListingSection>
      </Box>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  let userRegion: Regions[] | null | undefined = null;
  let isAuth = false;

  if (session && session.user.id) {
    isAuth = true;
    const matchedRegion = CombinedRegions.find((region) =>
      region.country.includes(session.user.location!),
    );
    if (matchedRegion?.region) {
      userRegion = [matchedRegion.region, Regions.GLOBAL];
    } else {
      userRegion = [Regions.GLOBAL];
    }
  }

  const openListings = await getListings({
    order: 'asc',
    statusFilter: 'open',
    userRegion,
  });

  return {
    props: {
      listings: JSON.parse(JSON.stringify(openListings)),
      isAuth,
      userRegion,
    },
  };
};
