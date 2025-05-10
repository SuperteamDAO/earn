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
  const displayValue = regionObject?.displayValue || regionObject?.name;
  const code = regionObject?.code;

  console.log(regionObject);

  const regionTooltipLabel = getRegionTooltipLabel(region, isGrant);

  return (
    <Tooltip content={regionTooltipLabel}>
      <div className="flex items-center gap-0.5">
        {region === 'GLOBAL' ? (
          <Globe className="h-4 w-4 text-slate-400" strokeWidth={1} />
        ) : (
          <UserFlag location={code || ''} isCode />
        )}
        <span className="rounded-full text-sm font-medium whitespace-nowrap text-slate-400">
          {region === 'GLOBAL' ? 'Global' : `${displayValue}`}
        </span>
        <Info className="size-3.5 text-slate-400 sm:hidden" />
      </div>
    </Tooltip>
  );
};
