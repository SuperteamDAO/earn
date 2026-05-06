import { QueryClient, dehydrate } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingsSection } from '@/features/listings/components/ListingsSection';
import { listingSelect } from '@/features/listings/constants/schema';
import { buildListingQuery } from '@/features/listings/utils/query-builder';
import { reorderFeaturedOngoing } from '@/features/listings/utils/reorderFeaturedOngoing';

interface HomePageProps {
  potentialSession: boolean;
}

export default function AllListingsPage({ potentialSession }: HomePageProps) {
  return (
    <Home
      type="listing"
      meta={
        <Meta
          title="All Crypto Opportunities | Web3 Bounties & Jobs | Superteam Earn"
          description="Browse all crypto bounties, web3 jobs, and Solana opportunities. Find remote work in blockchain development, design, content, and more. Earn cryptocurrency for your skills."
          canonical="https://superteam.fun/earn/all/"
          og={ASSET_URL + `/og/og.png`}
        />
      }
    >
      <HomepagePop />
      <div className="w-full">
        <ListingsSection type="all" potentialSession={potentialSession} />
      </div>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async ({
  req,
}) => {
  const cookies = req.headers.cookie || '';
  const cookieExists = /(^|;)\s*user-id-hint=/.test(cookies);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [
      'listings',
      'all',
      'all',
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
          tab: 'all',
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
