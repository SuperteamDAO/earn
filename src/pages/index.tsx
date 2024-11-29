import { Box, Flex } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { getServerSession } from 'next-auth';
import { useEffect, useState } from 'react';

import { CombinedRegions } from '@/constants/Superteam';
import {
  homepageForYouListingsQuery,
  homepageGrantsQuery,
  homepageListingsQuery,
} from '@/features/home';
import {
  getCombinedRegion,
  type Listing,
  ListingSection,
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

const GrantsCard = dynamic(
  () => import('@/features/grants').then((mod) => mod.GrantsCard),
  { ssr: false },
);

const EmptySection = dynamic(
  () =>
    import('@/components/shared/EmptySection').then((mod) => mod.EmptySection),
  { ssr: false },
);

export default function HomePage({
  listings,
  isAuth,
  userRegion,
  openForYouListings,
  userGrantsRegion,
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

  const { data: grants } = useQuery(
    homepageGrantsQuery({
      userRegion: userGrantsRegion,
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
          emoji="/assets/home/emojis/moneyman.webp"
          title="自由职业机会"
          viewAllLink="/all"
          take={20}
          showViewAll
        />
        {/* <ListingSection
          type="grants"
          title="资助"
          sub="为建设者提供资金支持"
          emoji="/assets/home/emojis/grants.webp"
          showViewAll
        >
          {!grants?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="暂无资助可申请！"
                message="订阅通知以便接收关于新资助项目的通知。"
              />
            </Flex>
          )}
          {grants &&
            grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
            })}
        </ListingSection> */}
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

  const openListings = await getListings({
    statusFilter: 'open',
    order: 'desc',
    userRegion,
    excludeIds: openForYouListings.map((listing) => listing.id),
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
