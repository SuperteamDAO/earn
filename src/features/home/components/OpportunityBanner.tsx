import Image from 'next/image';
import { useMemo } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';

import {
  getOpportunityDescription,
  getOpportunityDisplayName,
  type ParsedOpportunityTags,
} from '@/features/listings/utils/parse-opportunity-tags';

interface OpportunityBannerProps {
  readonly tags: ParsedOpportunityTags;
}

export function OpportunityBanner({ tags }: OpportunityBannerProps) {
  const { displayName, description } = useMemo(
    () => ({
      displayName: getOpportunityDisplayName(tags),
      description: getOpportunityDescription(tags),
    }),
    [tags],
  );

  return (
    <div className="relative flex h-52 w-full flex-col items-center md:h-72">
      <Image
        src={ASSET_URL + '/banner/banner'}
        alt={displayName}
        width={1440}
        height={290}
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute top-1/2 flex w-full max-w-7xl -translate-y-1/2 flex-col items-start px-2 md:px-6">
        <h2 className="text-2xl font-semibold text-white md:text-4xl">
          {displayName}
        </h2>
        <p className="mt-3 max-w-2xl text-left text-sm text-white md:text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}
