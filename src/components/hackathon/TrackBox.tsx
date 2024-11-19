import NextLink from 'next/link';

import { tokenList } from '@/constants';
import { type TrackProps } from '@/interface/hackathon';

export const TrackBox = ({
  title,
  sponsor,
  token,
  rewardAmount,
  slug,
}: TrackProps) => {
  return (
    <NextLink
      href={`/listings/hackathon/${slug}`}
      className="block rounded-lg border border-[#E2E8F0] p-3 md:p-4"
    >
      <div className="flex items-center gap-3">
        <img
          className="h-12 w-12 rounded object-cover md:h-14 md:w-14"
          alt={sponsor.name}
          src={sponsor.logo}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900 md:text-base">
            {title}
          </span>
          <span className="text-sm font-normal text-slate-500 md:text-base">
            {sponsor.name}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1">
        <img
          className="h-4 w-4 rounded-full md:h-6 md:w-6"
          alt={token}
          src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
        />
        <span className="text-sm font-semibold text-slate-700 md:text-base">
          {rewardAmount?.toLocaleString('en-us')}
        </span>
        <span className="text-sm font-semibold text-slate-400 md:text-base">
          {token}
        </span>
      </div>
    </NextLink>
  );
};
