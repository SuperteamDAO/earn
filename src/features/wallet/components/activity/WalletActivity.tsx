import { useQuery } from '@tanstack/react-query';

import { tokenActivityQuery } from '../../queries/fetch-activity';
import { TokenSkeleton } from '../tokens/TokenSkeleton';
import { ActivityItem } from './ActivityItem';

export const WalletActivity = () => {
  const { data: activities, isLoading, error } = useQuery(tokenActivityQuery);

  if (isLoading) {
    return (
      <div className="space-y-0.5">
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
    return <div className="px-8 py-4 text-slate-500">No activities found</div>;
  }

  return (
    <div className="">
      {activities.map((activity, index) => (
        <ActivityItem
          key={`${activity.timestamp}-${index}`}
          activity={activity}
        />
      ))}
    </div>
  );
};
