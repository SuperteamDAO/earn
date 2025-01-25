import { ArrowDownLeft, ArrowDownRight } from 'lucide-react';

import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { type TokenActivity } from '../../types/TokenActivity';

interface ActivityItemProps {
  activity: TokenActivity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const isCredit = activity.type === 'Credited';
  const amount = isCredit ? `+${activity.amount}` : `-${activity.amount}`;

  return (
    <div className="flex items-center justify-between px-6 py-2 sm:px-8 sm:py-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          {activity.tokenImg ? (
            <img
              src={activity.tokenImg}
              alt={activity.tokenSymbol}
              className="h-8 w-8 rounded-full sm:h-10 sm:w-10"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 sm:h-10 sm:w-10">
              <span className="text-xs text-blue-500 sm:text-sm">
                {activity.tokenSymbol}
              </span>
            </div>
          )}
          <div
            className={cn(
              'absolute -bottom-1 -right-1 rounded-full p-0.5',
              isCredit ? 'bg-emerald-50' : 'bg-slate-200',
            )}
          >
            {isCredit ? (
              <ArrowDownLeft className="h-3 w-3 text-emerald-500 sm:h-4 sm:w-4" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-slate-500 sm:h-4 sm:w-4" />
            )}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium sm:text-base">
            {activity.type}
          </div>
          <div className="text-xs text-slate-500 sm:text-sm">
            {activity.tokenSymbol}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div
          className={cn(
            'text-sm font-semibold tracking-tight sm:text-base',
            isCredit ? 'text-emerald-500' : 'text-slate-400',
          )}
        >
          {amount} {activity.tokenSymbol}
        </div>
        <div className="text-xs font-medium text-slate-500 sm:text-sm">
          ${formatNumberWithSuffix(activity.usdValue, 3, true)}
        </div>
      </div>
    </div>
  );
}
