import { Info, Pencil } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import MdOutlineChatBubbleOutline from '@/components/icons/MdOutlineChatBubbleOutline';
import { VerifiedBadgeLarge } from '@/components/shared/VerifiedBadge';
import { LocalImage } from '@/components/ui/local-image';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { PDTG } from '@/constants/Telegram';
import { useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type SponsorStats } from '../types';

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
    <div className="flex w-full gap-4">
      <div className="mb-6 w-full rounded-md border border-slate-200 bg-white px-6 py-5 text-white">
        <div className="flex items-center gap-6">
          <div className="flex shrink-0 items-center gap-3">
            <EarnAvatar
              className="h-12 w-12 rounded-md object-contain"
              id={sponsor?.name}
              avatar={sponsor?.logo}
            />

            <div>
              <div className="flex items-center">
                <div className="flex w-min items-center gap-1">
                  <p className="text-lg font-semibold whitespace-nowrap text-slate-900">
                    {sponsor?.name}
                  </p>
                  <div>
                    {!!user?.currentSponsor?.isVerified && (
                      <VerifiedBadgeLarge />
                    )}
                  </div>
                </div>

                {!isHackathon && (
                  <Link
                    className="ml-2 text-slate-500 hover:text-slate-800"
                    href={`/sponsor/edit`}
                  >
                    <Pencil className="h-4 w-4 text-slate-400" />
                  </Link>
                )}
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
          </div>
          <div className="h-14 w-0.5 border-r border-slate-200" />
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

      <div className="mb-6 w-[60%] max-w-[400px] rounded-md border border-slate-200 bg-indigo-50 px-8 py-5 text-white">
        <a
          className="ph-no-capture no-underline"
          href={PDTG}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => posthog.capture('message pratik_sponsor')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <LocalImage
                className="mr-3 h-[3.3rem] w-[3.2rem]"
                alt="message pratik"
                src={'/assets/sponsor/pratik.webp'}
              />

              <div>
                <p className="font-semibold whitespace-nowrap text-slate-900">
                  Stuck somewhere?
                </p>
                <p className="font-semibold whitespace-nowrap text-slate-500">
                  Message Us
                </p>
              </div>
            </div>
            <MdOutlineChatBubbleOutline color="#1E293B" size={24} />
          </div>
        </a>
      </div>
    </div>
  );
}
