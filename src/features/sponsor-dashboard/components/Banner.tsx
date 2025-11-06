import { ExternalLink, Info } from 'lucide-react';
import Link from 'next/link';

import { VerifiedBadgeLarge } from '@/components/shared/VerifiedBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type SponsorStats } from '../types';
import { HelpBanner } from './HelpBanner';

interface StatsTooltipProps {
  label: string;
  tooltipText: string;
  value: number | undefined;
  isLoading: boolean;
  isMonetary?: boolean;
}

const StatsTooltip = ({
  label,
  tooltipText,
  value,
  isLoading,
  isMonetary = false,
}: StatsTooltipProps) => (
  <Tooltip
    content={<p>{tooltipText}</p>}
    contentProps={{
      side: 'bottom',
    }}
  >
    <div className="cursor-pointer">
      <div className="flex items-center">
        <p className="mr-0.5 text-base font-normal whitespace-nowrap text-slate-500">
          {label}
        </p>
        <Info className="h-3 w-3 text-slate-400" />
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-5 w-[72px]" />
      ) : (
        <p className="text-left text-lg font-semibold text-slate-900">
          {isMonetary ? (
            <>
              $
              {new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 0,
              }).format(Math.round(value || 0))}
            </>
          ) : (
            value
          )}
        </p>
      )}
    </div>
  </Tooltip>
);

export function Banner({
  isHackathon,
  stats,
  isLoading,
}: {
  isHackathon?: boolean;
  stats: SponsorStats | undefined;
  isLoading: boolean;
}) {
  const { user } = useUser();

  const sponsorId = isHackathon ? user?.hackathonId : user?.currentSponsorId;

  const tooltipTextReward = !isHackathon
    ? `Total compensation (in USD) of listings where the winners have been announced`
    : `Total Rewards (in USD) of all hackathon tracks combined`;
  const tooltipTextListings = `Total number of listings added to Earn`;
  const tooltipTextSubmissions = `Total number of submissions/applications received on all listings`;

  const sponsor = isHackathon ? stats : user?.currentSponsor;

  if (!sponsorId) return null;
  return (
    <div className="mb-6 flex w-full flex-col gap-4 xl:flex-row xl:items-center">
      <div className="w-full rounded-md border border-slate-200 bg-white px-6 py-5 text-white">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
          <Link
            href={`/s/${sponsor?.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex shrink-0 items-center gap-3 pb-1 transition-opacity hover:opacity-80 lg:pb-0"
          >
            <EarnAvatar
              className="h-12 w-12 rounded-md object-contain"
              id={sponsor?.name}
              avatar={sponsor?.logo}
            />

            <div>
              <div className="flex items-center">
                <div className="flex w-min items-center gap-1">
                  <p className="text-lg font-semibold whitespace-nowrap text-slate-900 group-hover:underline">
                    {sponsor?.name}
                  </p>
                  <div>
                    {!!user?.currentSponsor?.isVerified && (
                      <VerifiedBadgeLarge />
                    )}
                  </div>
                  <ExternalLink className="ml-1 h-4 w-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="mt-2 h-5 w-[170px]" />
              ) : (
                <p className="-mt-0.5 text-[1.05rem] font-normal whitespace-nowrap text-slate-500">
                  {!isHackathon
                    ? `Sponsor since ${stats?.yearOnPlatform}`
                    : 'Hackathon'}
                </p>
              )}
            </div>
          </Link>
          <div className="block h-0.5 w-full border-t border-slate-200 lg:h-14 lg:w-0.5 lg:border-r" />
          <div className="flex gap-6 xl:gap-4 2xl:gap-6 [@media(min-width:1305px)]:gap-6">
            <StatsTooltip
              label={!isHackathon ? 'Rewarded' : 'Total Prizes'}
              tooltipText={tooltipTextReward}
              value={
                !isHackathon
                  ? stats?.totalRewardAmount
                  : stats?.totalHackathonRewards
              }
              isLoading={isLoading}
              isMonetary
            />

            <StatsTooltip
              label={!isHackathon ? 'Listings' : 'Tracks'}
              tooltipText={tooltipTextListings}
              value={
                !isHackathon
                  ? stats?.totalListingsAndGrants
                  : stats?.totalHackathonTracks
              }
              isLoading={isLoading}
            />

            <StatsTooltip
              label="Submissions"
              tooltipText={tooltipTextSubmissions}
              value={
                !isHackathon
                  ? stats?.totalSubmissionsAndApplications
                  : stats?.totalHackathonSubmissions
              }
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="xl:w-[60%] xl:max-w-[400px]">
        <HelpBanner />
      </div>
    </div>
  );
}
