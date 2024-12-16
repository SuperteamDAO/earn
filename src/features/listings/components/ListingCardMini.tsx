import dayjs from 'dayjs';
import Link from 'next/link';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { LocalImage } from '@/components/ui/local-image';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { tokenList } from '@/constants/tokenList';

import { type Listing } from '../types';
import { getListingIcon } from '../utils';
import { CompensationAmount } from './ListingPage/CompensationAmount';

export const ListingCardMini = ({ bounty }: { bounty: Listing }) => {
  const {
    rewardAmount,
    deadline,
    type,
    sponsor,
    title,
    token,
    slug,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
  } = bounty;

  const isBounty = type === 'bounty';

  return (
    <Link
      className="ph-no-capture w-full rounded-md px-2 py-4 hover:bg-gray-100 hover:no-underline"
      href={`/listings/${type}/${slug}`}
    >
      <div className="ph-no-capture flex w-full items-center justify-between">
        <div className="flex w-full">
          <LocalImage
            className="mr-3 h-14 w-14 rounded-md"
            alt={sponsor?.name!}
            src={
              sponsor?.logo
                ? sponsor.logo.replace(
                    '/upload/',
                    '/upload/c_scale,w_128,h_128,f_auto/',
                  )
                : `${ASSET_URL}/logo/sponsor-logo.png`
            }
          />
          <div className="flex w-full flex-col justify-between">
            <p className="ph-no-capture line-clamp-1 text-sm font-semibold text-slate-700 hover:underline">
              {title}
            </p>
            <div className="flex w-min items-center gap-1">
              <p className="w-full whitespace-nowrap text-xs text-slate-500">
                {sponsor?.name}
              </p>
              <div>{!!sponsor?.isVerified && <VerifiedBadge />}</div>
            </div>
            <div className="mt-px flex flex-wrap items-center gap-1">
              <div className="flex items-center justify-start">
                {compensationType !== 'variable' && (
                  <img
                    className="mr-0.5 h-4 w-4 rounded-full"
                    alt={token}
                    src={
                      tokenList.find((ele) => {
                        return ele.tokenSymbol === token;
                      })?.icon
                    }
                  />
                )}
                <div className="flex items-baseline">
                  <CompensationAmount
                    compensationType={compensationType}
                    maxRewardAsk={maxRewardAsk}
                    minRewardAsk={minRewardAsk}
                    rewardAmount={rewardAmount}
                    className="whitespace-nowrap text-xs font-semibold text-slate-600"
                  />
                  {compensationType !== 'variable' && (
                    <p className="text-xs font-medium text-gray-400">{token}</p>
                  )}
                </div>
                <p className="ml-1 text-xs text-slate-300 md:text-sm">|</p>
              </div>
              <img
                className={`flex h-3 ${isBounty ? '-ml-0.5' : 'ml-0'}`}
                alt={type}
                src={getListingIcon(type!)}
              />
              <p className="flex text-xs text-slate-300 md:text-sm">|</p>

              <div className="flex items-center gap-1">
                <p className="whitespace-nowrap text-xs text-gray-500">
                  {dayjs().isBefore(dayjs(deadline))
                    ? `Due ${dayjs(deadline).fromNow()}`
                    : `Closed ${dayjs(deadline).fromNow()}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
