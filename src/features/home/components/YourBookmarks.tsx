'use client';

import type { ReactNode } from 'react';

import type { ListingCardData } from '@/features/home/types/cards';
import { ListingCardMini } from '@/features/listings/components/ListingCardMini';

import { useJson } from '../hooks/use-json';

interface YourBookmarksProps {
  children: ReactNode;
  // Loaded on the server (the home sidebar); fetched here otherwise.
  listings?: ReadonlyArray<ListingCardData>;
  now?: number;
}

export const YourBookmarks = ({
  children,
  listings: loaded,
  now,
}: YourBookmarksProps) => {
  const { data, at } = useJson<ListingCardData[]>(
    loaded ? null : '/api/listings/bookmarks/?take=5',
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
