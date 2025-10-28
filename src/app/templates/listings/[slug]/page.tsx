import { ListingPageLayout } from '@/layouts/Listing';
import { api } from '@/lib/api';
import { getURL } from '@/utils/validUrl';

import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { ListingWinners } from '@/features/listings/components/ListingPage/ListingWinners';
import { type Listing } from '@/features/listings/types';

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

async function BountyDetails({ params }: PageProps) {
  const { slug } = await params;

  let bounty: Listing | null = null;
  try {
    const bountyDetails = await api.get(
      `${getURL()}api/sponsor-dashboard/templates/${slug}/`,
    );
    bounty = bountyDetails.data;
  } catch (e) {
    console.error(JSON.stringify(e, null, 2));
    bounty = null;
  }
  return (
    <ListingPageLayout isTemplate listing={bounty}>
      {bounty?.isWinnersAnnounced && (
        <div className="mt-6 hidden w-full md:block">
          <ListingWinners bounty={bounty} />
        </div>
      )}
      <DescriptionUI description={bounty?.description} />
    </ListingPageLayout>
  );
}

export default BountyDetails;
