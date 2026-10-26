'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { TokenIcon } from '@/components/ui/token-icon';

import { grantAmount } from '@/features/grants/utils/grantAmount';

interface GrantAmountProps {
  token?: string;
  minReward?: number;
  maxReward?: number;
}

const GrantAmount = ({ token, minReward, maxReward }: GrantAmountProps) => {
  return (
    <div className="-mt-2 flex items-center">
      <TokenIcon
        className="mr-1 h-4 w-4 rounded-full"
        alt={token ?? 'token'}
        symbol={token}
      />
      <div className="flex items-baseline gap-1">
        <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
          {grantAmount({
            maxReward: maxReward ?? 0,
            minReward: minReward ?? 0,
          })}
        </p>
        <p className="text-sm font-medium text-gray-600">{token}</p>
      </div>
    </div>
  );
};

const GrantEntry = ({
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
  return (
    <Link
      className="mx-auto block w-full cursor-pointer overflow-hidden rounded-lg border shadow-md transition-all duration-300 hover:shadow-lg sm:w-80"
      href={`/earn/grants/${slug}/`}
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
        <GrantAmount
          token={token}
          minReward={minReward}
          maxReward={maxReward}
        />
        {/* The card is the link (a nested <a> breaks hydration). */}
        <span className="block">
          <Button
            variant="outline"
            className="hover:bg-brand-purple w-full border-slate-300 bg-gray-100 text-sm font-medium text-slate-400 hover:text-white"
          >
            Apply Now
          </Button>
        </span>
      </div>
    </Link>
  );
};

import type { GrantCardData } from '@/features/home/types/cards';

// The grants page's cards: Earn's GrantEntry (features/grants), here with
// one link per card.
export function GrantEntries({
  grants,
}: {
  readonly grants: ReadonlyArray<GrantCardData & { readonly id: string }>;
}) {
  return (
    <>
      {grants.map((grant) => (
        <div key={grant.id} className="w-full max-w-[20rem]">
          <GrantEntry
            title={grant.title}
            slug={grant.slug}
            minReward={grant.minReward ?? undefined}
            maxReward={grant.maxReward ?? undefined}
            token={grant.token ?? undefined}
            logo={grant.logo ?? undefined}
          />
        </div>
      ))}
    </>
  );
}
