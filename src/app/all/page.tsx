import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Home } from '@/layouts/Home';
import { generatePageMetadata } from '@/layouts/metadata';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingCardSkeleton } from '@/features/listings/components/ListingCard';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

export const metadata: Metadata = generatePageMetadata({
  title: 'Superteam Earn | Work to Earn in Crypto',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  canonical: 'https://earn.superteam.fun',
});

function ListingsSectionFallback() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function AllListingsPage() {
  return (
    <Home type="listing">
      <HomepagePop />
      <div className="w-full">
        <Suspense fallback={<ListingsSectionFallback />}>
          <ListingsSection type="all" />
        </Suspense>
      </div>
    </Home>
  );
}
