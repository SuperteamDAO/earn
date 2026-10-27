import React from 'react';

import { Tooltip } from '@/components/ui/tooltip';
import { type User } from '@/interface/user';

export const InfoWrapper = ({
  children,
  isUserEligibleByRegion,
  regionTooltipLabel,
  user,
  cooldownTooltipContent,
}: {
  children: React.ReactNode;
  isUserEligibleByRegion: boolean;
  regionTooltipLabel: string;
  user: User | null | undefined;
  cooldownTooltipContent?: string;
}) => {
  const tooltipContent =
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
