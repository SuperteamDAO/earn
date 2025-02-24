import { useQuery } from '@tanstack/react-query';
import { forwardRef, useState } from 'react';

import { SubmissionDetails } from '@/features/listings/components/SubmissionsPage/SubmissionDetails';
import { submissionDetailsQuery } from '@/features/listings/queries/submission';

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
    const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
    const [subId, setSubId] = useState<string | null>(null);

    const { data } = useQuery({
      ...submissionDetailsQuery({ submissionId: subId ?? '' }),
      enabled: subId !== null,
    });

    return (
      <>
        {isDetailsOpen && data && (
          <SubmissionDetails
            open={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            submission={data.submission}
            bounty={data.listing}
          />
        )}
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
                        key={item.id}
                        type={type}
                        sub={item as any}
                        openDetails={(subId) => {
                          setSubId(subId);
                          setIsDetailsOpen(true);
                        }}
                      />
                    </div>
                  );
                case 'pow':
                  return (
                    <div {...itemProps}>
                      <PowCard key={item.id} type={type} pow={item as any} />
                    </div>
                  );
                case 'grant-application':
                  return (
                    <div {...itemProps}>
                      <GrantCard
                        type={type}
                        grant={item as any}
                        key={item.id}
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
