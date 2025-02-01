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
  const displayValue = regionObject?.name;
  const code = regionObject?.code;

  const regionTooltipLabel = getRegionTooltipLabel(region, isGrant);

  return (
    <Tooltip content={regionTooltipLabel}>
      <div className="flex items-center gap-1">
        {region === 'GLOBAL' ? (
          <Globe className="h-4 w-4" strokeWidth={1} />
        ) : (
          <UserFlag location={code || ''} isCode />
        )}
        <span className="whitespace-nowrap rounded-full text-xs font-medium text-slate-500 sm:text-sm">
          {region === 'GLOBAL' ? 'Global' : `${displayValue} Only`}
        </span>
        <Info className="h-3 w-3 text-slate-600 sm:hidden" />
      </div>
    </Tooltip>
  );
};
