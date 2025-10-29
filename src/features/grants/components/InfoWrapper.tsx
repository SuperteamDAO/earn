import React from 'react';

import { Tooltip } from '@/components/ui/tooltip';

export const InfoWrapper = ({
  children,
  isUserEligibleByRegion,
  regionTooltipLabel,
  user,
  cooldownTooltipContent,
  pausedTooltipContent,
}: {
  children: React.ReactNode;
  isUserEligibleByRegion: boolean;
  regionTooltipLabel: string;
  user: any;
  cooldownTooltipContent?: string;
  pausedTooltipContent?: string;
}) => {
  const tooltipContent =
    pausedTooltipContent ||
    cooldownTooltipContent ||
    (!isUserEligibleByRegion ? regionTooltipLabel : null);

  const isTooltipDisabled = !user?.id || !user?.isTalentFilled;

  return (
    <Tooltip
      content={tooltipContent}
      contentProps={{ className: 'rounded-md' }}
      disabled={isTooltipDisabled}
      triggerClassName="w-full"
    >
      {children}
    </Tooltip>
  );
};
