import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { GrTransaction } from 'react-icons/gr';

import { Button } from '@/components/ui/button';

import { tokenActivityQuery } from '../../queries/fetch-activity';
import { TokenSkeleton } from '../tokens/TokenSkeleton';
import { ActivityItem } from './ActivityItem';

export const WalletActivity = () => {
  const [visibleCount, setVisibleCount] = useState(3);
  const { authenticated } = usePrivy();
  const {
    data: activities,
    isLoading,
    error,
  } = useQuery({
    ...tokenActivityQuery,
    enabled: authenticated,
  });

  if (isLoading) {
    return (
      <div>
        <TokenSkeleton />
        <TokenSkeleton />
        <TokenSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-4 text-red-500">Failed to load activities</div>
    );
  }

  if (!activities?.length) {
    return (
      <div className="flex flex-col items-center gap-1 py-12">
        <GrTransaction className="h-10 w-10 text-slate-400" />
        <p className="mt-6 text-center text-lg font-medium text-slate-400">
          No activity yet
        </p>
        <p className="px-8 text-center text-sm text-slate-400">
          All earnings and withdrawals from your Earn wallet will show up here.
        </p>
      </div>
    );
  }

  const visibleActivities = activities.slice(0, visibleCount);
  const hasMore = visibleCount < activities.length;

  return (
    <div className="mt-0.5">
      {visibleActivities.map((activity, index) => (
        <ActivityItem
          key={`${activity.timestamp}-${index}`}
          activity={activity}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="mx-auto rounded-md py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            View More
          </Button>
        </div>
      )}
    </div>
  );
};
