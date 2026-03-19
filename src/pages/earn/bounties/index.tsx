import { QueryClient, dehydrate } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';

import { JsonLd } from '@/components/shared/JsonLd';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { generateBreadcrumbListSchema } from '@/utils/json-ld';

import { ListingsSection } from '@/features/listings/components/ListingsSection';
import { listingSelect } from '@/features/listings/constants/schema';
import { buildListingQuery } from '@/features/listings/utils/query-builder';
import { reorderFeaturedOngoing } from '@/features/listings/utils/reorderFeaturedOngoing';

interface BountiesPageProps {
  readonly potentialSession: boolean;
}

export default function BountiesPage({ potentialSession }: BountiesPageProps) {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Crypto Bounties' },
  ]);

  return (
    <Home
      type="listing"
      listingType="bounties"
      meta={
        <>
          <Meta
            title="Crypto Bounties | Web3 Bounties | Solana Bounties | Superteam Earn"
            description="Earn crypto by completing bounties. Find web3 bounties, Solana bounties, and crypto tasks in development, design, and content. Get paid in USDC for your skills."
            canonical="https://superteam.fun/earn/bounties/"
            og={ASSET_URL + `/og/og.png`}
          />
          <JsonLd data={[breadcrumbSchema]} />
        </>
      }
    >
      <div className="w-full">
        <ListingsSection
          type="all"
          potentialSession={potentialSession}
          defaultTab="bounties"
        />
      </div>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps<
  BountiesPageProps
> = async ({ req }) => {
  const cookies = req.headers.cookie || '';
  const cookieExists = /(^|;)\s*user-id-hint=/.test(cookies);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [
      'listings',
      'all',
      'bounties',
      'All',
      'open',
      'Date',
      'asc',
      null,
      null,
      null,
      false,
    ],
    queryFn: async () => {
      const { where, orderBy, take } = await buildListingQuery(
        {
          context: 'all',
          tab: 'bounties',
          category: 'All',
          status: 'open',
          sortBy: 'Date',
          order: 'asc',
        },
        null,
      );
      const listings = await prisma.bounties.findMany({
        where,
        orderBy,
        take,
        select: listingSelect,
      });
      return JSON.parse(JSON.stringify(reorderFeaturedOngoing(listings)));
    },
  });

  return {
    props: {
      potentialSession: cookieExists,
      dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
    },
  };
};
