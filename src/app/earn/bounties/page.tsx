import { ASSET_URL } from '@/constants/ASSET_URL';
import { Home } from '@/layouts/Home';
import { JsonLdScripts } from '@/layouts/JsonLdScripts';
import { pageMetadata } from '@/lib/metadata';
import { generateBreadcrumbListSchema } from '@/utils/json-ld';

import { ListingsSection } from '@/features/listings/components/ListingsSection';

export const metadata = pageMetadata({
  title: 'Crypto Bounties | Web3 Bounties | Solana Bounties | Superteam Earn',
  description:
    'Earn crypto by completing bounties. Find web3 bounties, Solana bounties, and crypto tasks in development, design, and content. Get paid in USDC for your skills.',
  canonical: 'https://superteam.fun/earn/bounties/',
  og: ASSET_URL + `/og/og.png`,
});

export default async function BountiesPage({
  searchParams,
}: PageProps<'/earn/bounties'>) {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Crypto Bounties' },
  ]);

  return (
    <Home type="listing" listingType="bounties">
      <JsonLdScripts data={[breadcrumbSchema]} />
      <div className="w-full">
        <ListingsSection
          type="all"
          searchParams={await searchParams}
          defaultTab="bounties"
        />
      </div>
    </Home>
  );
}
