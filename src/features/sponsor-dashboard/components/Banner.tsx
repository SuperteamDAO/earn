import { Info, Pencil } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { MdOutlineChatBubbleOutline } from 'react-icons/md';

import { VerifiedBadgeLarge } from '@/components/shared/VerifiedBadge';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { PDTG } from '@/constants';
import { EarnAvatar } from '@/features/talent';
import { useUser } from '@/store/user';

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
      className: 'bg-white text-gray-600',
      side: 'bottom',
    }}
  >
    <div className="cursor-pointer">
      <div className="flex items-center">
        <p className="mr-0.5 whitespace-nowrap text-base font-normal text-slate-500">
          {label}
        </p>
        <Info className="h-4 w-4 text-slate-400" />
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-5 w-[72px]" />
      ) : (
        <p className="text-lg font-semibold text-slate-900">
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
  const tooltipTextListings = `Total number of listings added to Earn`;
  const tooltipTextSubmissions = `Total number of submissions/applications received on all listings`;

  const sponsor = isHackathon ? stats : user?.currentSponsor;

  if (!sponsorId) return null;
  return (
    <div className="flex w-full gap-4">
      <div className="mb-6 w-full rounded-md border border-slate-200 bg-white px-6 py-6 text-white">
        <div className="flex items-center gap-6">
          <div className="flex flex-shrink-0 items-center gap-3">
            <EarnAvatar
              size="52px"
              id={sponsor?.name}
              avatar={sponsor?.logo}
              borderRadius="rounded-sm"
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
                  <Pencil className="h-[18px] w-[18px] text-slate-400" />
                </Link>
              </div>
              {isLoading ? (
                <Skeleton className="mt-2 h-5 w-[170px]" />
              ) : (
                <p className="whitespace-nowrap font-normal text-slate-500">
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

      <div className="mb-6 w-[60%] max-w-[400px] rounded-md border border-slate-200 bg-[#eef2ff] px-8 py-6 text-white">
        <a
          className="ph-no-capture no-underline"
          href={PDTG}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => posthog.capture('message pratik_sponsor')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExternalImage
                className="mr-3 h-14 w-[3.2rem]"
                alt="message pratik"
                src={'/sponsor/pratik.webp'}
              />
              <div>
                <p className="whitespace-nowrap font-semibold text-slate-900">
                  Stuck somewhere?
                </p>
                <p className="whitespace-nowrap font-semibold text-slate-500">
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
