import { type GetServerSideProps } from 'next';
import Head from 'next/head';

import { JsonLd } from '@/components/shared/JsonLd';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { generateBreadcrumbListSchema } from '@/utils/json-ld';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

interface JobsPageProps {
  readonly potentialSession: boolean;
}

export default function JobsPage({ potentialSession }: JobsPageProps) {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Crypto Jobs', url: '/jobs' },
  ]);

  return (
    <Home
      type="listing"
      listingType="projects"
      meta={
        <>
          <Meta
            title="Crypto Jobs & Web3 Careers | Solana Jobs | Superteam Earn"
            description="Find remote crypto jobs, web3 careers, and Solana opportunities. Browse bounties, freelance projects, and full-time positions in blockchain, DeFi, NFTs, and more. Earn crypto for your skills."
            canonical="https://earn.superteam.fun/jobs/"
            og={ASSET_URL + `/og/og.png`}
          />
          <Head>
            <meta
              name="keywords"
              content="crypto jobs, web3 jobs, solana jobs, blockchain jobs, remote crypto jobs, web3 careers, defi jobs, nft jobs, crypto freelance, blockchain developer jobs"
            />
          </Head>
          <JsonLd data={[breadcrumbSchema]} />
        </>
      }
    >
      <HomepagePop />

      <div className="w-full">
        <ListingsSection
          type="all"
          potentialSession={potentialSession}
          defaultTab="projects"
        />
      </div>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps<JobsPageProps> = async ({
  req,
}) => {
  const cookies = req.headers.cookie || '';
  const cookieExists = /(^|;)\s*user-id-hint=/.test(cookies);

  return { props: { potentialSession: cookieExists } };
};
