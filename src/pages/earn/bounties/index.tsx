import { type GetServerSideProps } from 'next';
import Link from 'next/link';

import { JsonLd } from '@/components/shared/JsonLd';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { generateBreadcrumbListSchema } from '@/utils/json-ld';

import { ListingsSection } from '@/features/listings/components/ListingsSection';

interface BountiesPageProps {
  readonly potentialSession: boolean;
}

export default function BountiesPage({ potentialSession }: BountiesPageProps) {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Crypto Bounties', url: '/earn/bounties/' },
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
      <nav aria-label="Breadcrumb" className="sr-only">
        <Link href="/earn">Home</Link>
        <span>/</span>
        <Link href="/earn/bounties">Crypto Bounties</Link>
      </nav>
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

  return { props: { potentialSession: cookieExists } };
};
