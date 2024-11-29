import { Regions } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { getServerSession } from 'next-auth';
import { useMemo } from 'react';

import { CombinedRegions } from '@/constants/Superteam';
import {
  homepageForYouListingsQuery,
  homepageGrantsQuery,
  homepageListingsQuery,
} from '@/features/home';
import {
  filterRegionCountry,
  getCombinedRegion,
  type Listing,
  ListingSection,
  ListingTabs,
} from '@/features/listings';
import { Home } from '@/layouts/Home';
import { prisma } from '@/prisma';

import { authOptions } from './api/auth/[...nextauth]';
import { getForYouListings } from './api/homepage/for-you';
import { getListings } from './api/homepage/listings';

interface Props {
  listings: Listing[];
  openForYouListings: Listing[];
  isAuth: boolean;
  userRegion: string[] | null;
  userGrantsRegion: string[] | null;
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

  const combinedListings = useMemo(() => {
    return [
      ...listings,
      ...(reviewListings ?? []),
      ...(completeListings ?? []),
    ];
  }, [listings, reviewListings, completeListings]);

  const combinedForYouListings = useMemo(() => {
    return [
      ...openForYouListings,
      ...(reviewForYouListings ?? []),
      ...(completeForYouListings ?? []),
    ];
  }, [openForYouListings, reviewForYouListings, completeForYouListings]);

  return (
    <Home type="landing" isAuth={isAuth}>
      <InstallPWAModal />
      <div className="w-full">
        <ListingTabs
          bounties={combinedListings}
          forYou={combinedForYouListings}
          isListingsLoading={false}
          emoji="/assets/home/emojis/moneyman.webp"
          title="Freelance Gigs"
          viewAllLink="/all"
          take={20}
          showViewAll
        />
        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.webp"
          showViewAll
        >
          {!grants?.length && (
            <div className="mt-8 flex items-center justify-center">
              <EmptySection
                title="No grants available!"
                message="Subscribe to notifications to get notified about new grants."
              />
            </div>
          )}
          {grants &&
            grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
            })}
        </ListingSection>
      </div>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  let userRegion: string[] | null | undefined = null;
  let userGrantsRegion: string[] | null | undefined = null;
  let isAuth = false;

  if (session && session.user.id) {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });
    if (user) {
      isAuth = true;
      const matchedRegion = user.location
        ? getCombinedRegion(user.location, true)
        : undefined;
      if (matchedRegion?.name) {
        userRegion = [
          matchedRegion.name,
          Regions.GLOBAL,
          ...(filterRegionCountry(matchedRegion, user.location || '').country ||
            []),
        ];
      } else {
        userRegion = [Regions.GLOBAL];
      }
      const matchedGrantsRegion = CombinedRegions.find((region) =>
        region.country.includes(session.user.location!),
      );
      if (matchedGrantsRegion?.region) {
        userGrantsRegion = [
          matchedGrantsRegion.region,
          Regions.GLOBAL,
          ...(matchedGrantsRegion.country || []),
        ];
      } else {
        userGrantsRegion = [Regions.GLOBAL];
      }
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
      openForYouListings: JSON.parse(JSON.stringify(openForYouListings)),
      listings: JSON.parse(JSON.stringify(openListings)),
      isAuth,
      userRegion,
      userGrantsRegion,
    },
  };
};
