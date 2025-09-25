import { useQuery } from '@tanstack/react-query';

import { cn } from '@/utils/cn';

import { totalsQuery } from '@/features/home/queries/totals';
import { userCountQuery } from '@/features/home/queries/user-count';

import { maxW } from '../utils/styles';

const formatNumber = (value: number | undefined): string => {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('en-US').format(value);
};

const formatUSD = (value: number | undefined): string => {
  if (typeof value !== 'number') return '$—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export function Stats2() {
  const { data: users } = useQuery(userCountQuery);
  const { data: totals } = useQuery(totalsQuery);

  const freelancers = formatNumber(users?.totalUsers);
  const paidOut = formatUSD(totals?.totalInUSD);
  const mav = '>50,000';

  return (
    <div
      className={cn(
        'flex w-screen items-center justify-center',
        maxW,
        'mx-[1.875rem] px-[1.875rem] lg:mx-[7rem] lg:px-[7rem] xl:mx-[11rem] xl:px-[11rem]',
      )}
    >
      <div className="flex w-full items-center justify-center gap-10 md:gap-20">
        <div className="flex flex-col items-center text-center">
          <p className="text-[2rem] leading-none font-semibold text-indigo-600 md:text-[2.5rem]">
            {freelancers}
          </p>
          <p className="mt-2 text-xl text-slate-600">Freelancers on Earn</p>
        </div>

        <span className="hidden h-8 w-px bg-slate-200 md:block" />

        <div className="flex flex-col items-center text-center">
          <p className="text-[2rem] leading-none font-semibold text-indigo-600 md:text-[2.5rem]">
            {paidOut}
          </p>
          <p className="mt-2 text-xl text-slate-600">Paid Out by Sponsors</p>
        </div>

        <span className="hidden h-8 w-px bg-slate-200 md:block" />

        <div className="flex flex-col items-center text-center">
          <p className="text-[2rem] leading-none font-semibold text-indigo-600 md:text-[2.5rem]">
            {mav}
          </p>
          <p className="mt-2 text-xl text-slate-600">Monthly Active Visitors</p>
        </div>
      </div>
    </div>
  );
}
