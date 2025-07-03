import { CircleDollarSign } from 'lucide-react';

import TbBriefcase2 from '@/components/icons/TbBriefcase2';
import { Skeleton } from '@/components/ui/skeleton';

export const TotalStats = ({
  bountyCount,
  TVE,
  isTotalLoading,
}: {
  bountyCount: number | undefined;
  TVE: number | undefined;
  isTotalLoading: boolean;
}) => {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-1 rounded-lg border border-indigo-50 bg-slate-50 px-5 py-4">
      <div className="flex">
        <CircleDollarSign className="text-brand-purple mr-1 mb-auto h-[1.5625rem]" />
        <div>
          {isTotalLoading ? (
            <Skeleton className="h-3.5 w-[54px]" />
          ) : (
            <p className="text-sm font-semibold text-black">
              {TVE?.toLocaleString('en-us')}{' '}
              <span className="text-slate-500">USD</span>
            </p>
          )}
          <p className="text-xs font-normal text-gray-500">
            Total Value Earned
          </p>
        </div>
      </div>
      <div className="h-[100%] w-px bg-indigo-100" />
      <div className="flex">
        <TbBriefcase2 className="text-brand-purple mr-1 mb-auto size-6" />
        <div>
          {isTotalLoading ? (
            <Skeleton className="h-3.5 w-[32px]" />
          ) : (
            <p className="text-sm font-semibold text-black">{bountyCount}</p>
          )}
          <p className="text-xs font-normal text-gray-500">
            Opportunities Listed
          </p>
        </div>
      </div>
    </div>
  );
};
