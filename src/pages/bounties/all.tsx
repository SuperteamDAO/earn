import { useQuery } from '@tanstack/react-query';

import { EmptySection } from '@/components/shared/EmptySection';
import { Home } from '@/layouts/Home';
import { cn } from '@/utils/cn';

import {
  ListingCard,
  ListingCardSkeleton,
} from '@/features/listings/components/ListingCard';
import { ListingSection } from '@/features/listings/components/ListingSection';
import { listingsQuery } from '@/features/listings/queries/listings';

export default function AllBountiesPage() {
  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      type: 'bounty',
      take: 2000,
    }),
  );

  return (
    <Home type="listing">
      <div className={cn('w-full', 'lg:pr-6')}>
        <ListingSection
          type="bounties"
          title="All Bounties"
          sub="Bite sized tasks for freelancers"
          showEmoji
        >
          {isLoading &&
            Array.from({ length: 8 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          {!isLoading && !listings?.length && (
            <div className="mt-8 flex items-center justify-center">
              <EmptySection
                title="No listings available!"
                message="Update your email preferences (from the user menu) to be notified about new work opportunities."
              />
            </div>
          )}
          {!isLoading &&
            listings?.map((bounty) => (
              <ListingCard key={bounty.id} bounty={bounty} />
            ))}
        </ListingSection>
      </div>
    </Home>
  );
}
