import { ArrowDownLeft, ArrowDownRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { type TokenActivity } from '../../types/TokenActivity';
import { type TxData } from '../../types/TxData';
import { type DrawerView } from '../WalletDrawer';

interface ActivityItemProps {
  activity: TokenActivity;
  setView: (view: DrawerView) => void;
  setTxData: (txData: TxData) => void;
}

export function ActivityItem({
  activity,
  setView,
  setTxData,
}: ActivityItemProps) {
  const isCredit = activity.type === 'Credited';
  const amount = isCredit ? `+${activity.amount}` : `-${activity.amount}`;

  return (
    <Button
      variant="ghost"
      className="flex h-auto w-full justify-between px-6 py-2 hover:bg-accent sm:px-8 sm:py-4"
      onClick={() => {
        setView('history');
        setTxData({
          signature: activity.signature,
          tokenAddress: activity.tokenAddress,
          amount: activity.amount.toString(),
          address: activity.counterpartyAddress,
          timestamp: activity.timestamp,
          type: activity.type,
        });
      }}
    >
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
          <div className="text-left text-xs text-slate-500 sm:text-sm">
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
    </Button>
  );
}
