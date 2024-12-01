import Link from 'next/link';
import React from 'react';

import { Button } from '@/components/ui/button';
import { tokenList } from '@/constants';

import { grantAmount } from '../utils';

export const GrantEntry = ({
  title,
  minReward,
  maxReward,
  token,
  slug,
  logo,
}: {
  title: string;
  rewardAmount?: number;
  token?: string;
  slug: string;
  logo?: string;
  minReward?: number;
  maxReward?: number;
}) => {
  const tokenIcon = tokenList.find((ele) => ele.tokenSymbol === token)?.icon;

  const GrantAmount = () => {
    return (
      <div className="-mt-2 flex items-center">
        <img
          className="mr-1 h-4 w-4 rounded-full"
          alt={token}
          src={tokenIcon}
        />
        <div className="flex items-baseline gap-1">
          <p className="whitespace-nowrap text-sm font-semibold text-slate-600">
            {grantAmount({
              maxReward: maxReward!,
              minReward: minReward!,
            })}
          </p>
          <p className="text-sm font-medium text-gray-600">{token}</p>
        </div>
      </div>
    );
  };

  return (
    <Link
      className="w-full overflow-hidden rounded-lg border shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-80"
      href={`/grants/${slug}`}
    >
      <div className="relative">
        <img
          className="h-[240px] w-full object-cover sm:h-[180px]"
          alt={title}
          src={logo || '/api/placeholder/400/240'}
        />
      </div>
      <div className="flex flex-col gap-2 px-4 pb-4 pt-1.5">
        <p
          className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-lg font-semibold text-slate-700"
          title={title}
        >
          {title}
        </p>
        <GrantAmount />
        <Link href={`/grants/${slug}`}>
          <Button
            variant="outline"
            className="w-full border-slate-300 text-sm font-medium text-slate-400"
          >
            Apply Now
          </Button>
        </Link>
      </div>
    </Link>
  );
};
