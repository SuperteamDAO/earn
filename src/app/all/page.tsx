import type { Metadata } from 'next';

import { Home } from '@/layouts/Home';
import { generatePageMetadata } from '@/layouts/metadata';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

export const metadata: Metadata = generatePageMetadata({
  title: 'Superteam Earn | Work to Earn in Crypto',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  canonical: 'https://earn.superteam.fun',
});

export default function AllListingsPage() {
  return (
    <Home type="listing">
      <HomepagePop />
      <div className="w-full">
        <ListingsSection type="all" />
      </div>
    </Home>
  );
}
