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
    <div className="flex items-center justify-between px-6 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="relative">
          {activity.tokenImg ? (
            <img
              src={activity.tokenImg}
              alt={activity.tokenSymbol}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm text-blue-500">
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
              <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-slate-500" />
            )}
          </div>
        </div>
        <div>
          <div className="font-medium">{activity.type}</div>
          <div className="text-sm text-slate-500">{activity.tokenSymbol}</div>
        </div>
      </div>
      <div className="text-right">
        <div
          className={cn(
            'font-semibold tracking-tight',
            isCredit ? 'text-emerald-500' : 'text-slate-400',
          )}
        >
          {amount} {activity.tokenSymbol}
        </div>
        <div className="text-sm font-medium text-slate-500">
          ${formatNumberWithSuffix(activity.usdValue, 3, true)}
        </div>
      </div>
    </div>
  );
}
