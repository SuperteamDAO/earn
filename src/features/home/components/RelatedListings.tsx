import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { type ReactNode, useMemo } from 'react';

import {
  ListingCardMobile,
  listingsQuery,
  relatedlistingsQuery,
} from '@/features/listings';

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
  const { data: relatedListings } = useQuery(
    relatedlistingsQuery({
      take: SHOW_LIMIT,
      listingId,
    }),
  );

  const deadline = useMemo(() => dayjs().add(1, 'day').toISOString(), []);

  const { data: liveListings } = useQuery({
    ...listingsQuery({
      take: SHOW_LIMIT - (relatedListings?.length ?? SHOW_LIMIT),
      isHomePage: true,
      deadline,
      order: 'asc',
      type: isHackathon ? 'hackathon' : undefined,
      excludeIds: ids ? ids : undefined,
      exclusiveSponsorId,
    }),
    enabled: (relatedListings?.length ?? 0) < SHOW_LIMIT,
  });

  return (
    <div>
      {children}
      <div className="mt-1 flex w-full flex-col">
        {[
          ...(relatedListings ? relatedListings : []),
          ...(liveListings ? liveListings : []),
        ]?.map((listing) => (
          <ListingCardMobile bounty={listing} key={listing?.id} />
        ))}
      </div>
    </div>
  );
};
