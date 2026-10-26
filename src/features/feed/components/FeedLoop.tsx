'use client';

import { forwardRef } from 'react';

import { useMounted } from '../hooks/use-mounted';
import type { FeedDataProps } from '../types';
import { FeedCardContainerSkeleton } from './FeedCardContainer';
import { GrantCard } from './grantCard';
import { PowCard } from './powCard';
import { SubmissionCard } from './submissionCard';

interface Props {
  feed: FeedDataProps[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  ref?: (node?: Element | null) => void;
  children: React.ReactNode;
  type: 'activity' | 'profile';
}

export const FeedLoop = forwardRef<HTMLDivElement, Omit<Props, 'ref'>>(
  ({ feed: feedItems, isLoading, isFetchingNextPage, children, type }, ref) => {
    const mounted = useMounted();
    return (
      <>
        {isLoading || !mounted ? (
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
                    <div key={item.id ?? index} {...itemProps}>
                      <SubmissionCard key={item.id} type={type} sub={item} />
                    </div>
                  );
                case 'pow':
                  return (
                    <div key={item.id ?? index} {...itemProps}>
                      <PowCard key={item.id} type={type} pow={item} />
                    </div>
                  );
                case 'grant-application':
                  return (
                    <div key={item.id ?? index} {...itemProps}>
                      <GrantCard type={type} grant={item} key={item.id} />
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
