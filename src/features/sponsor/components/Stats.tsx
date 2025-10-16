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

export function Stats() {
  const { data: users } = useQuery(userCountQuery);
  const { data: totals } = useQuery(totalsQuery);

  const freelancers = formatNumber(users?.totalUsers);
  const paidOut = formatUSD(totals?.totalInUSD);
  const mav = '>50,000';

  return (
    <div
      className={cn(
        'mx-auto flex w-screen items-center justify-center py-20',
        maxW,
        'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
      )}
    >
      <div className="flex w-full flex-col justify-between gap-10 md:flex-row md:items-center md:gap-0 xl:gap-20">
        <div className="flex flex-col md:items-center md:text-center">
          <p className="text-[3.25rem] leading-none font-semibold text-indigo-600">
            {freelancers}
          </p>
          <p className="mt-2 text-xl text-slate-600">Freelancers on Earn</p>
        </div>

        <span className="hidden h-16 w-px bg-slate-200 md:block" />
        <span className="block h-px w-56 bg-slate-200 md:hidden" />

        <div className="flex flex-col md:items-center md:text-center">
          <p className="text-[3.25rem] leading-none font-semibold text-indigo-600">
            {paidOut}
          </p>
          <p className="mt-2 text-xl text-slate-600">Paid Out by Sponsors</p>
        </div>

        <span className="hidden h-16 w-px bg-slate-200 md:block" />
        <span className="block h-px w-56 bg-slate-200 md:hidden" />

        <div className="flex flex-col md:items-center md:text-center">
          <p className="text-[3.25rem] leading-none font-semibold text-indigo-600">
            {mav}
          </p>
          <p className="mt-2 text-xl text-slate-600">Monthly Active Visitors</p>
        </div>
      </div>
    </div>
  );
}
