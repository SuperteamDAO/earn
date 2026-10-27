import { forwardRef } from 'react';

import { type FeedDataProps } from '../types';
import { FeedCardContainerSkeleton } from './FeedCardContainer';
import { GrantCard } from './grantCard';
import { PowCard } from './powCard';
import { SubmissionCard } from './submissionCard';

interface Props {
  feed: FeedDataProps[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  ref?: (node?: Element | null | undefined) => void;
  children: React.ReactNode;
  type: 'activity' | 'profile';
}

export const FeedLoop = forwardRef<HTMLDivElement, Omit<Props, 'ref'>>(
  ({ feed: feedItems, isLoading, isFetchingNextPage, children, type }, ref) => {
    return (
      <>
        {isLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <FeedCardContainerSkeleton key={index} />
          ))
        ) : feedItems.length > 0 ? (
          <>
            {feedItems.map((item, index) => {
              const isLastItem = index === feedItems.length - 1;
              const itemProps = isLastItem ? { ref } : {};

              switch (item.type) {
                case 'submission':
                  return (
                    <div key={item.id} {...itemProps}>
                      <SubmissionCard type={type} sub={item} />
                    </div>
                  );
                case 'pow':
                  return (
                    <div key={item.id} {...itemProps}>
                      <PowCard type={type} pow={item} />
                    </div>
                  );
                case 'grant-application':
                  return (
                    <div key={item.id} {...itemProps}>
                      <GrantCard type={type} grant={item} />
                    </div>
                  );
                default:
                  return null;
              }
            })}
            {isFetchingNextPage && <FeedCardContainerSkeleton />}
            <div ref={ref} style={{ height: '10px' }} />
          </>
        ) : (
          <>{children}</>
        )}
      </>
    );
  },
);

FeedLoop.displayName = 'FeedLoop';
