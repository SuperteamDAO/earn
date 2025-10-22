'use client';
import { useRouter } from 'next/navigation';

import { timeAgoShort } from '@/utils/timeAgo';

interface FeedCardHeaderProps {
  name: string;
  username?: string;
  action: string;
  description?: string;
  photo: string | undefined;
  createdAt: string;
  type: 'activity' | 'profile';
}

export const FeedCardHeader = ({
  name,
  username,
  action,
  description,
  createdAt,
  type,
}: FeedCardHeaderProps) => {
  const router = useRouter();
  if (type === 'profile') {
    return (
      <div className="-mt-0.5 -mb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm font-medium text-slate-400 md:text-base">
              <span className="font-semibold text-slate-800">{name}</span>{' '}
              {action}
            </p>
          </div>
          <p className="text-xs font-medium text-slate-400 md:text-sm">
            {timeAgoShort(createdAt)}
          </p>
        </div>
        <p className="text-sm break-all text-slate-500 md:text-base">
          {description}
        </p>
      </div>
    );
  }
  return (
    <div className="flex">
      <div className="-mt-0.5 flex flex-col">
        <p
          className="cursor-pointer text-sm font-semibold text-slate-800 hover:underline md:text-base"
          onClick={() => router.push(`/t/${username}`)}
        >
          {name}
        </p>
        <div className="flex items-center gap-1">
          <p className="cursor-pointer text-xs font-medium text-slate-400 hover:underline md:-mt-1 md:text-sm">
            @{username}
          </p>
          <p className="text-xs font-medium text-slate-400 md:-mt-1 md:text-sm">
            • {timeAgoShort(createdAt)}
          </p>
        </div>
        <p className="mt-1 text-sm font-medium text-slate-600 md:mt-2 md:text-base">
          {action}
        </p>
      </div>
    </div>
  );
};
