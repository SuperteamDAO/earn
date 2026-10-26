import { ASSET_URL } from '@/constants/ASSET_URL';
import { Home } from '@/layouts/Home';
import { pageMetadata } from '@/lib/metadata';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

export const metadata = pageMetadata({
  title: 'All Crypto Opportunities | Web3 Bounties & Jobs | Superteam Earn',
  description:
    'Browse all crypto bounties, web3 jobs, and Solana opportunities. Find remote work in blockchain development, design, content, and more. Earn cryptocurrency for your skills.',
  canonical: 'https://superteam.fun/earn/all/',
  og: ASSET_URL + `/og/og.png`,
});

export default async function AllListingsPage({
  searchParams,
}: PageProps<'/earn/all'>) {
  const params = await searchParams;
  const category = params.category;
  return (
    <Home
      type="listing"
      allCategory={(Array.isArray(category) ? category[0] : category) ?? ''}
    >
      <HomepagePop />
      <div className="w-full">
        <ListingsSection type="all" searchParams={params} />
      </div>
    </Home>
  );
}
