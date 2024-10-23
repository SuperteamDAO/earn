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
}

export const FeedLoop = forwardRef<HTMLDivElement, Omit<Props, 'ref'>>(
  ({ feed: feedItems, isLoading, isFetchingNextPage, children }, ref) => {
    return (
      <>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
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
                    <div {...itemProps}>
                      <SubmissionCard
                        key={index}
                        sub={item as any}
                        type="activity"
                      />
                    </div>
                  );
                case 'pow':
                  return (
                    <div {...itemProps}>
                      <PowCard key={index} pow={item as any} type="activity" />
                    </div>
                  );
                case 'grant-application':
                  return (
                    <div {...itemProps}>
                      <GrantCard
                        type="activity"
                        grant={item as any}
                        key={index}
                      />
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
