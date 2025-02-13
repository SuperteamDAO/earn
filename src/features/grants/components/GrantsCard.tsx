import Link from 'next/link';
import React from 'react';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { LocalImage } from '@/components/ui/local-image';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { tokenList } from '@/constants/tokenList';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import type { GrantWithApplicationCount } from '../types';
import { grantAmount } from '../utils/grantAmount';

export const GrantsCard = ({ grant }: { grant: GrantWithApplicationCount }) => {
  const {
    sponsor,
    slug,
    title,
    minReward,
    maxReward,
    token,
    totalApproved,
    totalApplications,
  } = grant;

  const sponsorLogo = sponsor?.logo
    ? sponsor.logo.replace('/upload/', '/upload/c_scale,w_128,h_128,f_auto/')
    : ASSET_URL + '/logo/sponsor-logo.png';

  const tokenIcon = tokenList.find((ele) => ele.tokenSymbol === token)?.icon;

  return (
    <Link
      className="block w-full rounded-md bg-white px-2 py-4 hover:bg-gray-100 hover:no-underline sm:px-4"
      href={`/grants/${slug}`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex w-full">
          <LocalImage
            className="mr-3 h-14 w-14 rounded-md sm:mr-5 sm:h-16 sm:w-16"
            alt={sponsor?.name!}
            src={sponsorLogo}
          />
          <div className="flex w-full flex-col justify-between">
            <p className="line-clamp-1 text-sm font-semibold text-slate-700 hover:underline sm:text-base">
              {title}
            </p>
            <div className="flex w-min items-center gap-1">
              <p className="w-full text-xs whitespace-nowrap text-slate-500 md:text-sm">
                {sponsor?.name}
              </p>
              <div>{!!sponsor?.isVerified && <VerifiedBadge />}</div>
            </div>
            <div className="mt-[1px] flex items-center gap-1 sm:gap-3">
              <div className="flex items-center justify-start sm:hidden">
                <LocalImage
                  className="mr-0.5 h-3.5 w-3.5 rounded-full"
                  alt={token!}
                  src={tokenIcon!}
                />
                <div className="flex items-baseline">
                  <p className="text-xs font-semibold whitespace-nowrap text-slate-600 sm:text-base">
                    {grantAmount({
                      maxReward: maxReward!,
                      minReward: minReward!,
                    })}
                  </p>
                  <p className="ml-0.5 text-xs font-medium text-gray-400">
                    {token}
                  </p>
                </div>
                <p className="ml-1 text-[10px] text-slate-300">|</p>
              </div>
              <div className="flex items-center gap-1">
                <LocalImage
                  className="-ml-0.5 flex h-3 sm:h-4"
                  alt={'grant'}
                  src={'/assets/grant-icon.svg'}
                />
                <p className="flex text-xs font-medium text-gray-500">Grant</p>
              </div>
              {!!totalApproved && (
                <div className="flex items-center gap-1">
                  <p className="flex text-xs text-slate-300 md:text-sm">|</p>
                  <p className="text-[11px] font-medium whitespace-nowrap text-gray-500 sm:text-xs">
                    $
                    {formatNumberWithSuffix(
                      Number(
                        (
                          Number(totalApproved) / Number(totalApplications)
                        ).toFixed(2),
                      ),
                    )}
                    <span className="word-spacing-tight ml-0.3 text-[11px] font-medium text-gray-400 sm:text-xs">
                      {' '}
                      Avg. Grant
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mr-3 hidden items-center justify-start sm:flex">
          <LocalImage
            className="mr-1 h-4 w-4 rounded-full"
            alt={token!}
            src={tokenIcon!}
          />
          <div className="flex items-baseline gap-1">
            <p className="text-xs font-semibold whitespace-nowrap text-slate-600 sm:text-base">
              {grantAmount({
                maxReward: maxReward!,
                minReward: minReward!,
              })}
            </p>
            <p className="text-xs font-medium text-gray-400 sm:text-base">
              {token}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
