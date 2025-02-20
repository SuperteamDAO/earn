import Link from 'next/link';
import React from 'react';

import { Button } from '@/components/ui/button';
import { tokenList } from '@/constants/tokenList';

import { grantAmount } from '../utils/grantAmount';

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
          <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
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
      className="mx-auto block w-full cursor-pointer overflow-hidden rounded-lg border shadow-md transition-all duration-300 hover:shadow-lg sm:w-80"
      href={`/grants/${slug}`}
    >
      <div className="relative">
        <img
          className="h-[180px] w-full object-cover"
          alt={title}
          src={logo || '/api/placeholder/400/240'}
        />
      </div>
      <div className="relative flex flex-col gap-2 px-4 pt-1.5 pb-4">
        <p
          className="max-w-full overflow-hidden text-lg font-semibold text-ellipsis whitespace-nowrap text-slate-700"
          title={title}
        >
          {title}
        </p>
        <GrantAmount />
        <Link href={`/grants/${slug}`} className="block">
          <Button
            variant="outline"
            className="hover:bg-brand-purple w-full border-slate-300 bg-gray-100 text-sm font-medium text-slate-400 hover:text-white"
          >
            Apply Now
          </Button>
        </Link>
      </div>
    </Link>
  );
};
