import { type GetServerSideProps } from 'next';
import Link from 'next/link';

import { JsonLd } from '@/components/shared/JsonLd';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { generateBreadcrumbListSchema } from '@/utils/json-ld';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

interface HomePageProps {
  potentialSession: boolean;
}

export default function AllListingsPage({ potentialSession }: HomePageProps) {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'All Crypto Opportunities', url: '/earn/all/' },
  ]);

  return (
    <Home
      type="listing"
      meta={
        <>
          <Meta
            title="All Crypto Opportunities | Web3 Bounties & Jobs | Superteam Earn"
            description="Browse all crypto bounties, web3 jobs, and Solana opportunities. Find remote work in blockchain development, design, content, and more. Earn cryptocurrency for your skills."
            canonical="https://superteam.fun/earn/all/"
            og={ASSET_URL + `/og/og.png`}
          />
          <JsonLd data={[breadcrumbSchema]} />
        </>
      }
    >
      <HomepagePop />
      <nav aria-label="Breadcrumb" className="sr-only">
        <Link href="/earn">Home</Link>
        <span>/</span>
        <Link href="/earn/all">All Crypto Opportunities</Link>
      </nav>
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

  return { props: { potentialSession: cookieExists } };
};
