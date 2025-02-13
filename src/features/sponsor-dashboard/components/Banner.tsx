import { Info, Pencil } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { VerifiedBadgeLarge } from '@/components/shared/VerifiedBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { PROJECT_NAME, SUPPORT_EMAIL } from '@/constants/project';
import { useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

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
        <p className="mr-0.5 whitespace-nowrap text-base font-normal text-slate-500">
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
  stats: any;
  isLoading: boolean;
}) {
  const { user } = useUser();
  const posthog = usePostHog();
  const sponsorId = isHackathon ? user?.hackathonId : user?.currentSponsorId;

  const tooltipTextReward = `Total compensation (in USD) of listings where the winners have been announced`;
  const tooltipTextListings = `Total number of listings added to ${PROJECT_NAME}`;
  const tooltipTextSubmissions = `Total number of submissions/applications received on all listings`;

  const sponsor = isHackathon ? stats : user?.currentSponsor;

  if (!sponsorId) return null;
  return (
    <div className="flex w-full gap-4">
      <div className="mb-6 w-full rounded-md border border-slate-200 bg-white px-6 py-5 text-white">
        <div className="flex items-center gap-6">
          <div className="flex flex-shrink-0 items-center gap-3">
            <EarnAvatar
              className="h-12 w-12 rounded-md"
              id={sponsor?.name}
              avatar={sponsor?.logo}
            />
            <div>
              <div className="flex items-center">
                <div className="flex w-min items-center gap-1">
                  <p className="whitespace-nowrap text-lg font-semibold text-slate-900">
                    {sponsor?.name}
                  </p>
                  <div>{!!sponsor?.isVerified && <VerifiedBadgeLarge />}</div>
                </div>

                <Link
                  className="ml-2 text-slate-500 hover:text-slate-800"
                  href={`/sponsor/edit`}
                >
                  <Pencil className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
              {isLoading ? (
                <Skeleton className="mt-2 h-5 w-[170px]" />
              ) : (
                <p className="-mt-0.5 whitespace-nowrap text-[1.05rem] font-normal text-slate-500">
                  {!isHackathon
                    ? `Sponsor since ${stats?.yearOnPlatform}`
                    : 'Hackathon'}
                </p>
              )}
            </div>
          </div>
          <div className="h-14 w-0.5 border-r border-slate-200" />
          <StatsTooltip
            label={!isHackathon ? 'Rewarded' : 'Total Prizes'}
            tooltipText={tooltipTextReward}
            value={stats?.totalRewardAmount}
            isLoading={isLoading}
            isMonetary
          />

          <StatsTooltip
            label={!isHackathon ? 'Listings' : 'Tracks'}
            tooltipText={tooltipTextListings}
            value={stats?.totalListingsAndGrants}
            isLoading={isLoading}
          />

          <StatsTooltip
            label="Submissions"
            tooltipText={tooltipTextSubmissions}
            value={stats?.totalSubmissionsAndApplications}
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="mb-6 w-[60%] max-w-[400px] rounded-md border border-slate-200 bg-indigo-50 px-8 py-5 text-white">
        <a
          className="ph-no-capture no-underline"
          href={`mailto:${SUPPORT_EMAIL}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => posthog.capture('message pratik_sponsor')}
        ></a>
      </div>
    </div>
  );
}
