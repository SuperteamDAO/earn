import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useMemo } from 'react';

import { ListingCardMobile, listingsQuery } from '@/features/listings';
import { dayjs } from '@/utils/dayjs';

interface LiveListingProps {
  children: ReactNode;
  isHackathon?: boolean;
  excludeIds?: string[];
  exclusiveSponsorId?: string;
}

export const LiveListings = ({
  children,
  isHackathon = false,
  exclusiveSponsorId,
  excludeIds: ids,
}: LiveListingProps) => {
  const deadline = useMemo(() => dayjs().add(1, 'day').toISOString(), []);

  const { data: listings } = useQuery(
    listingsQuery({
      take: 5,
      isHomePage: true,
      deadline,
      order: 'asc',
      type: isHackathon ? 'hackathon' : undefined,
      excludeIds: ids ? ids : undefined,
      exclusiveSponsorId,
    }),
  );
  return (
    <div>
      {children}
      <div className="mt-1 flex w-full flex-col">
        {listings?.map((listing) => {
          return <ListingCardMobile bounty={listing} key={listing?.id} />;
        })}
      </div>
    </div>
  );
};
