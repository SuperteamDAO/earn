import { CircularProgress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { tokenList } from '@/constants/tokenList';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { type GrantApplicationWithTranches } from '../queries/user-application';
import { type GrantWithApplicationCount } from '../types';

interface ApplicationStats {
  application: GrantApplicationWithTranches;
  grant: GrantWithApplicationCount;
}

export const ApplicationStats = ({ application, grant }: ApplicationStats) => {
  const totalPaid = application.GrantTranche.reduce(
    (acc, curr) => acc + (curr.status === 'Paid' ? curr.ask : 0),
    0,
  );
  const totalPaidPercentage = (totalPaid / application.approvedAmount) * 100;
  return (
    <>
      <div>
        <p className="font-semibold text-slate-700">Project Title</p>
        <p className="text-slate-500">{application.projectTitle}</p>
      </div>
      <Separator className="my-3 bg-slate-100" />
      <p className="text-sm font-semibold text-slate-600">
        Total Approved Grant
      </p>
      <div className={cn('flex w-full justify-between pb-4 pt-2', 'md:mb-2')}>
        <div className="flex w-fit flex-col gap-6">
          <div className="flex w-fit items-center gap-1">
            <img
              className="h-5 w-5 rounded-full"
              alt={'green doller'}
              src={
                tokenList.filter((e) => e?.tokenSymbol === grant.token)[0]
                  ?.icon ?? '/assets/dollar.svg'
              }
            />
            <p className="font-semibold text-slate-600">
              {formatNumberWithSuffix(
                application?.approvedAmount || 0,
                1,
                true,
              )}{' '}
              {grant.token}
            </p>
          </div>
        </div>
        <div className="flex w-fit flex-col gap-6">
          <div className="flex gap-1.5">
            <CircularProgress
              className="h-5 w-5 rounded-full bg-gray-200"
              value={totalPaidPercentage}
            />
            <p className="text-sm font-semibold text-slate-500">
              {totalPaidPercentage.toFixed(0)}% paid
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
