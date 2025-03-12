import { Tooltip } from '@/components/ui/tooltip';

export const InfoWrapper = ({
  children,
  isUserEligibleByRegion,
  regionTooltipLabel,
  user,
}: {
  children: React.ReactNode;
  isUserEligibleByRegion: boolean;
  regionTooltipLabel: string;
  user: any;
}) => {
  return (
    <Tooltip
      content={!isUserEligibleByRegion ? regionTooltipLabel : null}
      contentProps={{ className: 'rounded-md' }}
      disabled={!user?.id || !user?.isTalentFilled || isUserEligibleByRegion}
    >
      {children}
    </Tooltip>
  );
};
