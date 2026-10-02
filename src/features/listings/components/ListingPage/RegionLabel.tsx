import { useQuery } from '@tanstack/react-query';
import lookup from 'country-code-lookup';
import { Globe, Info } from 'lucide-react';
import Link from 'next/link';

import { UserFlag } from '@/components/shared/UserFlag';
import { Tooltip } from '@/components/ui/tooltip';

import { chaptersQuery } from '@/features/chapters/queries/chapters';

import {
  getCombinedRegion,
  getRegionSlug,
  getRegionTooltipLabel,
} from '../../utils/region';

export const RegionLabel = ({
  region,
  isGrant = false,
}: {
  region: string | undefined;
  isGrant?: boolean;
}) => {
  const { data: chapters = [] } = useQuery(chaptersQuery);
  const regionObject = region
    ? getCombinedRegion(region, false, chapters)
    : null;
  const code = regionObject?.code;

  const regionTooltipLabel = getRegionTooltipLabel(region, isGrant, chapters);

  let displayValue = 'Global';

  if (region !== 'Global' && region) {
    const details = lookup.byCountry(region);
    displayValue =
      details?.internet ||
      details?.iso3 ||
      regionObject?.displayValue ||
      region;
  }

  const regionSlug =
    region && region !== 'Global' ? getRegionSlug(region, chapters) : null;

  const inner = (
    <div className="flex items-center gap-0.5">
      {region === 'Global' ? (
        <Globe className="h-4 w-4 text-slate-400" strokeWidth={1} />
      ) : (
        <UserFlag location={code || ''} isCode />
      )}
      <span className="rounded-full text-sm font-medium whitespace-nowrap text-slate-400">
        {displayValue}
      </span>
      <Info className="size-3.5 text-slate-400 sm:hidden" />
    </div>
  );

  return (
    <Tooltip content={regionTooltipLabel}>
      {regionSlug ? (
        <Link href={`/earn/regions/${regionSlug}`} className="hover:opacity-80">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </Tooltip>
  );
};
