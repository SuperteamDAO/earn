import { Regions } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { getServerSession } from 'next-auth';
import { useMemo } from 'react';

import { CombinedRegions } from '@/constants/Team';
import { Home } from '@/layouts/Home';
import { prisma } from '@/prisma';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { homepageForYouListingsQuery } from '@/features/home/queries/for-you';
import { homepageListingsQuery } from '@/features/home/queries/listings';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingSection } from '@/features/listings/components/ListingSection';
import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { listingsQuery } from '@/features/listings/queries/listings';
import { type Listing } from '@/features/listings/types';
import {
  filterRegionCountry,
  getCombinedRegion,
} from '@/features/listings/utils/region';

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

const EmptySection = dynamic(
  () =>
    import('@/components/shared/EmptySection').then((mod) => mod.EmptySection),
  { ssr: false },
);

export default function HomePage({
  isAuth,
  userRegion,
  openForYouListings,
}: Props) {
  const { data: listings } = useQuery(
    listingsQuery({
      take: 100,
    }),
  );
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

  const { data: sponsorships } = useQuery(
    listingsQuery({
      type: 'sponsorship',
      take: 100,
    }),
  );

  const combinedListings = useMemo(() => {
    return [
      ...(listings ?? []),
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
      <HomepagePop />
      <div className="w-full">
        <ListingTabs
          bounties={combinedListings}
          forYou={combinedForYouListings}
          isListingsLoading={false}
          showEmoji
          title="Freelance Gigs"
          viewAllLink="/all"
          take={20}
          showViewAll
        />
        <ListingSection
          type="bounties"
          title="Sponsorships"
          sub="Sponsor projects and get exposure"
          showEmoji
          showViewAll
        >
          {!sponsorships?.length && (
            <div className="mt-8 flex items-center justify-center">
              <EmptySection
                title="No sponsorships available!"
                message="Subscribe to notifications to get notified about new sponsorships."
              />
            </div>
          )}
          {sponsorships &&
            sponsorships
              ?.filter((sponsorship) => sponsorship.status === 'OPEN')
              .map((sponsorship) => {
                return (
                  <ListingCard key={sponsorship.id} bounty={sponsorship} />
                );
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
