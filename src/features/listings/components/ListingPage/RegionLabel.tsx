import lookup from 'country-code-lookup';
import { Globe, Info } from 'lucide-react';
import React from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import { Tooltip } from '@/components/ui/tooltip';

import { getCombinedRegion, getRegionTooltipLabel } from '../../utils/region';

export const RegionLabel = ({
  region,
  isGrant = false,
}: {
  region: string | undefined;
  isGrant?: boolean;
}) => {
  const regionObject = region ? getCombinedRegion(region) : null;
  const code = regionObject?.code;

  const regionTooltipLabel = getRegionTooltipLabel(region, isGrant);

  let displayValue = 'Global';

  const titlecase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (region !== 'GLOBAL' && region) {
    const country = titlecase(region);
    const details = lookup.byCountry(country);
    displayValue = details?.iso3 || country;
  }

  return (
    <Tooltip content={regionTooltipLabel}>
      <div className="flex items-center gap-0.5">
        {region === 'GLOBAL' ? (
          <Globe className="h-4 w-4 text-slate-400" strokeWidth={1} />
        ) : (
          <UserFlag location={code || ''} isCode />
        )}
        <span className="rounded-full text-sm font-medium whitespace-nowrap text-slate-400">
          {displayValue}
        </span>
        <Info className="size-3.5 text-slate-400 sm:hidden" />
      </div>
    </Tooltip>
  );
};
