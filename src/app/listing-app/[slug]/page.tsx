import { ListingPop } from '@/features/conversion-popups/components/ListingPop';
import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { ListingWinners } from '@/features/listings/components/ListingPage/ListingWinners';

import { getListing } from './fetch-listing';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function Page({ params }: PageProps) {
  const listing = await getListing(params.slug);

  if (!listing) {
    return null; // Layout will handle the notFound() case
  }

  return (
    <>
      <ListingPop listing={listing} />
      {listing.isWinnersAnnounced && (
        <div className="mt-6 hidden w-full md:block">
          <ListingWinners bounty={listing} />
        </div>
      )}
      <DescriptionUI description={listing.description} />
    </>
  );
}
