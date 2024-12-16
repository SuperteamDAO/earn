import { useQuery } from '@tanstack/react-query';

import { userCountQuery } from '@/features/home';
import { cn } from '@/utils';

import { maxW } from '../utils';
import { HighQualityImage } from './HighQualityImage';

type Stats = {
  title: string;
  label: string;
  showEarn?: boolean;
};

const initialStats = [
  {
    title: '21K',
    label: 'Global Discord',
  },
  {
    title: '75K',
    label: 'Twitter Followers',
  },
  {
    title: '$4M',
    label: 'Community GDP',
  },
  {
    title: '100K',
    label: 'Monthly Views',
    showEarn: true,
  },
  {
    title: '16K',
    label: 'Verified Earn Users',
    showEarn: true,
  },
  {
    title: '20',
    label: 'Countries',
  },
];

export function Stats() {
  const { data: totals } = useQuery(userCountQuery);

  const stats = initialStats.map((stat) => {
    if (stat.label === 'Verified Earn Users' && totals?.totalUsers) {
      return {
        ...stat,
        title: new Intl.NumberFormat('en-US', {
          notation: 'compact',
          compactDisplay: 'short',
          maximumFractionDigits: 0,
        }).format(totals.totalUsers),
      };
    }
    return stat;
  });

  return (
    <div
      className={cn(
        'flex w-screen items-center gap-16 lg:flex-row-reverse lg:gap-20',
        maxW,
        'mx-[1.875rem] px-[1.875rem] lg:mx-[7rem] lg:px-[7rem] xl:mx-[11rem] xl:px-[11rem]',
      )}
    >
      <div className="w-full max-w-[20rem] xl:max-w-[30rem]">
        <HighQualityImage
          src="/landingsponsor/displays/global-earn.webp"
          alt="Superteam Earn Global"
          className="w-full max-w-[30rem]"
        />
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <h2 className="text-[2rem] font-semibold leading-none md:text-[3.5rem]">
            The distribution of the Superteam network
          </h2>
          <p className="mt-4 text-[1.25rem] font-medium text-slate-500 lg:text-[1.4rem]">
            Get instant access to Superteam’s network of the best crypto talent
            in the world
          </p>
        </div>

        <hr className="hidden lg:block" />

        <div className="grid w-full grid-cols-3 gap-4 gap-x-8">
          {stats.map((s) => (
            <div
              key={s.title}
              className="flex flex-col items-center gap-0 overflow-visible lg:items-start"
            >
              <p className="text-[2.3rem] font-semibold leading-[1.15] lg:text-[3.5rem]">
                {s.title}
              </p>
              <p className="relative flex items-center gap-1 whitespace-nowrap text-[0.68rem] font-medium text-slate-500 lg:text-base">
                {s.showEarn && (
                  <span className="top-0 w-[0.6rem] lg:w-[0.9rem]">
                    <HighQualityImage
                      src="/landingsponsor/icons/earn.svg"
                      alt="Earn Icon"
                      className="h-full w-full"
                    />
                  </span>
                )}
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
