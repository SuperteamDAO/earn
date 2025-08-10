import { Box } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { getServerSession } from 'next-auth';
import { useEffect, useState } from 'react';

import { CombinedRegions } from '@/constants/Superteam';
import {
  homepageForYouListingsQuery,
  homepageListingsQuery,
} from '@/features/home';
import {
  getCombinedRegion,
  type Listing,
  ListingTabs,
} from '@/features/listings';
import { Home } from '@/layouts/Home';

import { authOptions } from './api/auth/[...nextauth]';
import { getForYouListings } from './api/homepage/for-you';
import { getListings } from './api/homepage/listings';

interface Props {
  listings: Listing[];
  openForYouListings: Listing[];
  isAuth: boolean;
  userRegion: string[] | null;
  userGrantsRegion: Regions[] | null;
}

const InstallPWAModal = dynamic(
  () =>
    import('@/components/modals/InstallPWAModal').then(
      (mod) => mod.InstallPWAModal,
    ),
  { ssr: false },
);

export default function HomePage({
  listings,
  isAuth,
  userRegion,
  openForYouListings,
}: Props) {
  const [combinedListings, setCombinedListings] = useState(listings);
  const [combinedForYouListings, setCombinedForYouListings] =
    useState(listings);

  const { data: reviewForYouListings } = useQuery({
    ...homepageForYouListingsQuery({
      statusFilter: 'review',
      order: 'desc',
    }),
    enabled: isAuth,
  });

  const { data: completeForYouListings } = useQuery({
    ...homepageForYouListingsQuery({
      statusFilter: 'completed',
      order: 'desc',
    }),
    enabled: isAuth,
  });

  const { data: reviewListings } = useQuery(
    homepageListingsQuery({
      order: 'desc',
      statusFilter: 'review',
      userRegion,
      excludeIds: reviewForYouListings?.map((l) => l.id!),
    }),
  );

  const { data: completeListings } = useQuery(
    homepageListingsQuery({
      order: 'desc',
      statusFilter: 'completed',
      userRegion,
      excludeIds: completeForYouListings?.map((l) => l.id!),
    }),
  );

  useEffect(() => {
    if (reviewListings && completeListings) {
      setCombinedListings([
        ...listings,
        ...reviewListings,
        ...completeListings,
      ]);
    }
  }, [reviewListings, completeListings, listings]);

  useEffect(() => {
    if (reviewForYouListings && completeForYouListings) {
      setCombinedForYouListings([
        ...openForYouListings,
        ...reviewForYouListings,
        ...completeForYouListings,
      ]);
    }
  }, [reviewForYouListings, completeForYouListings, openForYouListings]);

  return (
    <Home type="landing" isAuth={isAuth}>
      <InstallPWAModal />
      <Box w={'100%'}>
        <ListingTabs
          bounties={combinedListings}
          forYou={combinedForYouListings}
          isListingsLoading={false}
          emoji=""
          title="自由职业机会"
          viewAllLink="/all"
          take={20}
          showViewAll
        />
      </Box>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  let userRegion: string[] | null | undefined = null;
  let userGrantsRegion: Regions[] | null | undefined = null;
  let isAuth = false;

  if (session && session.user.id) {
    isAuth = true;
    const matchedRegion = getCombinedRegion(session.user.location);
    if (matchedRegion) {
      userRegion = [matchedRegion.name, Regions.GLOBAL];
    } else {
      userRegion = [Regions.GLOBAL];
    }
    const matchedGrantsRegion = CombinedRegions.find((region) =>
      region.country.includes(session.user.location!),
    );
    if (matchedGrantsRegion?.region) {
      userGrantsRegion = [matchedGrantsRegion.region, Regions.GLOBAL];
    } else {
      userGrantsRegion = [Regions.GLOBAL];
    }
  }

  let openForYouListings: Awaited<ReturnType<typeof getForYouListings>> = [];
  if (session && session.user.id) {
    openForYouListings = await getForYouListings({
      statusFilter: 'open',
      order: 'desc',
      userId: session.user.id,
    });
  }

  const tab = context.query.tab as string;
  
  const openListings = await getListings({
    statusFilter: 'open',
    order: 'desc',
    userRegion,
    excludeIds: openForYouListings.map((listing) => listing.id),
    tab,
  });

  return {
    props: {
      listings: JSON.parse(JSON.stringify(openListings)),
      openForYouListings: JSON.parse(JSON.stringify(openForYouListings)),
      isAuth,
      userRegion,
      userGrantsRegion,
    },
  };
};
