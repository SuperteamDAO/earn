import { Regions } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';

import { CombinedRegions } from '@/constants/Superteam';
import { Home } from '@/layouts/Home';
import { api } from '@/lib/api';
import { prisma } from '@/prisma';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { homepageForYouListingsQuery } from '@/features/home/queries/for-you';
import { homepageGrantsQuery } from '@/features/home/queries/grants';
import { homepageListingsQuery } from '@/features/home/queries/listings';
import { ListingSection } from '@/features/listings/components/ListingSection';
import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { type Listing } from '@/features/listings/types';
import {
  filterRegionCountry,
  getCombinedRegion,
} from '@/features/listings/utils/region';

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
  () =>
    import('@/features/grants/components/GrantsCard').then(
      (mod) => mod.GrantsCard,
    ),
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

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await api.get('/api/wallet/assets', {
          params: {
            publicKey: 'BdiMNsZAPoyvLP9evKmb1GkCM61SPGc8d1nQvHyvff3v',
          },
        });
        console.log('Solana assets:', response.data);
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    };

    fetchAssets();
  }, []);

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
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          showEmoji
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  let userRegion: string[] | null | undefined = null;
  let userGrantsRegion: string[] | null | undefined = null;
  let isAuth = false;

  const privyDid = await getPrivyToken(context.req);
  let openForYouListings: Awaited<ReturnType<typeof getForYouListings>> = [];

  if (privyDid) {
    const user = await prisma.user.findUnique({
      where: { privyDid },
    });

    openForYouListings = await getForYouListings({
      statusFilter: 'open',
      order: 'desc',
      userId: user?.id,
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
        region.country.includes(user.location!),
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
