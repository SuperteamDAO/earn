import Link from 'next/link';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { tokenList } from '@/constants/tokenList';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { type GrantWithApplicationCount } from '../types';
import { grantAmount } from '../utils/grantAmount';

export const GrantsCardMini = ({
  grant,
}: {
  grant: GrantWithApplicationCount;
}) => {
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

  const tokenIcon = tokenList.find((ele) => ele.tokenSymbol === token)?.icon;

  const sponsorLogo = sponsor?.logo
    ? sponsor.logo.replace('/upload/', '/upload/c_scale,w_128,h_128,f_auto/')
    : ASSET_URL + '/logo/sponsor-logo.png';
  return (
    <Link
      className="block w-full rounded-md bg-white px-2 py-4 hover:bg-gray-100 hover:no-underline"
      href={`/grants/${slug}`}
    >
      <div className="ph-no-capture flex w-full items-center justify-between">
        <div className="flex w-full">
          <img
            className="mr-3 h-14 w-14 rounded-md"
            src={sponsorLogo}
            alt={sponsor?.name}
          />
          <div className="flex w-full flex-col justify-between">
            <p className="ph-no-capture line-clamp-1 text-sm font-semibold text-slate-700 hover:underline">
              {title}
            </p>
            <div className="flex w-min items-center gap-1">
              <p className="w-full text-xs whitespace-normal text-slate-500">
                {sponsor?.name}
              </p>
              <div>{!!sponsor?.isVerified && <VerifiedBadge />}</div>
            </div>
            <div className="mt-px flex items-center gap-1 sm:gap-3">
              <div className="flex items-center justify-start gap-1">
                <img
                  className="flex h-3 rounded-full sm:h-4"
                  alt={token}
                  src={tokenIcon}
                />
                <div className="flex items-baseline gap-0.5">
                  <p className="text-xs font-semibold whitespace-nowrap text-slate-600">
                    {grantAmount({
                      maxReward: maxReward!,
                      minReward: minReward!,
                    })}
                  </p>
                  <p className="text-xs font-medium text-gray-400">{token}</p>
                </div>
              </div>
              {!!totalApproved && (
                <div className="flex items-center gap-3">
                  <p className="flex text-xs text-slate-300 lg:text-sm">|</p>
                  <p className="text-xs font-medium whitespace-nowrap text-gray-500 md:text-[0.71875rem]">
                    $
                    {formatNumberWithSuffix(
                      Number((totalApproved / totalApplications).toFixed(2)),
                    )}
                    <span className="ml-[0.3] text-xs font-medium text-gray-400 [word-spacing:-0.09rem] md:text-[0.6875rem]">
                      {' '}
                      Avg. Grant
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
