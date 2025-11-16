import { useQuery } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { ListingCardMini } from '@/features/listings/components/ListingCardMini';
import { yourBookmarksQuery } from '@/features/listings/queries/your-bookmarks';

interface YourBookmarksProps {
  children: ReactNode;
}

export const YourBookmarks = ({ children }: YourBookmarksProps) => {
  const { data: listings } = useQuery(yourBookmarksQuery({ take: 5 }));
  return (
    <div>
      {children}
      <div className="mt-1 flex w-full flex-col">
        {listings?.map((listing) => {
          return <ListingCardMini bounty={listing} key={listing?.id} />;
        })}
      </div>
    </div>
  );
};
