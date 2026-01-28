import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { type ReactNode, useMemo } from 'react';

import { ListingCardMini } from '@/features/listings/components/ListingCardMini';
import { liveListingsQuery } from '@/features/listings/queries/live-listings';
import { relatedlistingsQuery } from '@/features/listings/queries/related-listing';

interface LiveListingProps {
  children: ReactNode;
  listingId: string;
  isHackathon?: boolean;
  excludeIds?: string[];
  exclusiveSponsorId?: string;
}

const SHOW_LIMIT = 5;

export const RelatedListings = ({
  children,
  listingId,
  isHackathon = false,
  exclusiveSponsorId,
  excludeIds: ids,
}: LiveListingProps) => {
  const deadline = useMemo(() => dayjs().add(1, 'day').toISOString(), []);

  const { data: relatedListings } = useQuery(
    relatedlistingsQuery({
      take: SHOW_LIMIT,
      listingId,
    }),
  );

  const { data: liveListings } = useQuery(
    liveListingsQuery({
      take: SHOW_LIMIT,
      deadline,
      order: 'asc',
      type: isHackathon ? 'hackathon' : undefined,
      excludeIds: ids ? ids : undefined,
      exclusiveSponsorId,
    }),
  );

  const combinedListings = useMemo(() => {
    const related = relatedListings ?? [];
    if (related.length >= SHOW_LIMIT) return related.slice(0, SHOW_LIMIT);

    const relatedIds = new Set(related.map((l) => l.id));
    const remaining = (liveListings ?? [])
      .filter((l) => !relatedIds.has(l.id))
      .slice(0, SHOW_LIMIT - related.length);

    return [...related, ...remaining];
  }, [relatedListings, liveListings]);

  return (
    <div>
      {children}
      <div className="mt-1 flex w-full flex-col">
        {combinedListings.map((listing) => (
          <ListingCardMini bounty={listing} key={listing?.id} />
        ))}
      </div>
    </div>
  );
};
