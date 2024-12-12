import { Info } from 'lucide-react';
import React from 'react';
import { LuGlobe } from 'react-icons/lu';

import { UserFlag } from '@/components/shared/UserFlag';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';

import { getCombinedRegion, getRegionTooltipLabel } from '../../utils';

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
    <>
      <Tooltip content={regionTooltipLabel}>
        <div className="flex items-center gap-2">
          {region === 'GLOBAL' ? (
            <LuGlobe className="h-4 w-4" strokeWidth={1} />
          ) : (
            <UserFlag location={code || ''} isCode />
          )}
          <span className="whitespace-nowrap rounded-full text-xs font-medium text-slate-500 sm:text-sm">
            {region === 'GLOBAL' ? 'Global' : `${displayValue} Only`}
          </span>
        </div>
      </Tooltip>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex sm:hidden">
            <Info className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="text-xs font-medium text-slate-500">
            {regionTooltipLabel}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};
