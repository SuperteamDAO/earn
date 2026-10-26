'use client';

import { type ReactNode, useMemo } from 'react';

import { dayjs } from '@/utils/dayjs';

import type { ListingCardData } from '@/features/home/types/cards';
import { ListingCardMini } from '@/features/listings/components/ListingCardMini';

import { queryString, useJson } from '../hooks/use-json';

interface LiveListingProps {
  children: ReactNode;
  isHackathon?: boolean;
  excludeIds?: string[];
  exclusiveSponsorId?: string;
  // Loaded on the server (the home sidebar); fetched here otherwise.
  listings?: ReadonlyArray<ListingCardData>;
  now?: number;
}

export const LiveListings = ({
  children,
  isHackathon = false,
  exclusiveSponsorId,
  excludeIds: ids,
  listings: loaded,
  now,
}: LiveListingProps) => {
  const deadline = useMemo(() => dayjs().add(1, 'day').toISOString(), []);

  const { data, at } = useJson<ListingCardData[]>(
    loaded
      ? null
      : `/api/listings/live/?${queryString({
          take: 5,
          deadline,
          order: 'asc',
          type: isHackathon ? 'hackathon' : undefined,
          excludeIds: ids,
          exclusiveSponsorId,
        })}`,
  );
  const listings = loaded ?? data;
  return (
    <div>
      {children}
      <div className="mt-1 flex w-full flex-col">
        {listings?.map((listing) => {
          return (
            <ListingCardMini
              bounty={listing}
              now={now ?? at}
              key={listing?.id}
            />
          );
        })}
      </div>
    </div>
  );
};
