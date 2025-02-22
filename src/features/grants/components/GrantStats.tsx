import { tokenList } from '@/constants/tokenList';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { type GrantWithApplicationCount } from '../types';
import { grantAmount } from '../utils/grantAmount';
import { DollarIcon, PayoutIcon, TimeToPayIcon } from './icons';

interface GrantStatsProps {
  grant: GrantWithApplicationCount;
}

export const GrantStats = ({ grant }: GrantStatsProps) => {
  return (
    <>
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img
            className="h-8 w-8 rounded-full"
            alt={'green doller'}
            src={
              tokenList.filter((e) => e?.tokenSymbol === grant.token)[0]
                ?.icon ?? '/assets/dollar.svg'
            }
          />
          <p className="text-lg font-semibold text-slate-700 md:text-xl">
            {grantAmount({
              maxReward: grant.maxReward!,
              minReward: grant.minReward!,
            })}{' '}
            <span className="text-slate-500">{grant.token}</span>
          </p>
        </div>
        <p className="-mt-1 text-sm font-medium text-slate-500">Cheque Size</p>
      </div>
      <div
        className={cn(
          'flex w-full justify-between py-4',
          'md:mb-2',
          grant?.link && !grant?.isNative && 'hidden',
        )}
      >
        <div className="flex w-fit flex-col gap-4">
          <div className="flex w-fit flex-col">
            <div className="flex w-fit">
              <TimeToPayIcon />
              <p className="text-lg font-medium text-slate-700 md:text-xl">
                {grant?.avgResponseTime}
              </p>
            </div>
            <p className="w-max pl-2 text-sm font-medium uppercase text-slate-500">
              Avg. Response Time
            </p>
          </div>
          <div className="flex w-fit flex-col">
            <div className="flex">
              <PayoutIcon />
              <p className="text-lg font-medium text-slate-700 md:text-xl">
                {grant.totalApproved
                  ? new Intl.NumberFormat('en-US', {
                      maximumFractionDigits: 0,
                      currency: 'USD',
                      style: 'currency',
                    }).format(
                      Math.round(
                        grant?.totalApproved / grant?.totalApplications,
                      ),
                    )
                  : '—'}
              </p>
            </div>
            <p className="w-max pl-2 text-sm font-medium uppercase text-slate-500">
              Avg. Grant Size
            </p>
          </div>
        </div>
        <div className="flex w-fit flex-col gap-4">
          <div className="flex flex-col">
            <div className="flex">
              <DollarIcon />
              <p className="text-lg font-medium text-slate-700 md:text-xl">
                $
                {formatNumberWithSuffix(
                  Math.round(grant?.totalApproved || 0),
                  1,
                  true,
                )}
              </p>
            </div>
            <p className="w-max pl-2 text-sm font-medium uppercase text-slate-500">
              Approved So Far
            </p>
          </div>
          <div className="flex flex-col">
            <div className="flex">
              <TimeToPayIcon />
              <p className="text-lg font-medium text-slate-700 md:text-xl">
                {grant?.totalApplications}
              </p>
            </div>
            <p className="w-max pl-2 text-sm font-medium uppercase text-slate-500">
              Recipients
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
