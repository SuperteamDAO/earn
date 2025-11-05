'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Eye, Rocket } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { tokenList } from '@/constants/tokenList';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { dayjs } from '@/utils/dayjs';

import { grantAmount } from '@/features/grants/utils/grantAmount';
import { sponsorStageQuery } from '@/features/home/queries/sponsor-stage';
import { SponsorStage } from '@/features/home/types/sponsor-stage';
import { submissionCountQuery } from '@/features/listings/queries/submission-count';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';
import { getListingStatus } from '@/features/listings/utils/status';
import { SponsorPrize } from '@/features/sponsor-dashboard/components/SponsorPrize';

function formatDeadlineDate(deadline: string | undefined): string {
  if (!deadline) return '-';
  return dayjs(deadline).format('Do MMM');
}

export function SponsorListing() {
  const isLg = useBreakpoint('lg');

  const { data, isLoading } = useQuery({
    ...sponsorStageQuery,
    enabled: false,
  });

  const listingId = data?.listing?.id;
  const { data: submissionCount } = useQuery({
    ...submissionCountQuery(listingId ?? ''),
    enabled: !!listingId,
  });

  if (isLoading || !data || !data.stage || !data.listing || !isLg) {
    return null;
  }

  const { listing } = data;

  if (
    data.stage === SponsorStage.NEW_SPONSOR ||
    data.stage === SponsorStage.NEXT_LISTING
  ) {
    return null;
  }

  const sponsorLogo = listing.sponsor?.logo
    ? listing.sponsor.logo.replace(
        '/upload/',
        '/upload/c_scale,w_128,h_128,f_auto/',
      )
    : `${ASSET_URL}/logo/sponsor-logo.png`;

  const tokenIcon =
    tokenList.filter((e) => e?.tokenSymbol === listing.token)[0]?.icon ??
    '/assets/dollar.svg';

  const status = getListingStatus(listing);
  const statusColors = getColorStyles(status);

  const formattedDeadline = formatDeadlineDate(listing.deadline);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium tracking-wide text-gray-400 uppercase">
        RECENT {listing.type?.toUpperCase()}
      </span>

      <Link
        href={`/listing/${listing.slug}`}
        className="block overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors hover:border-gray-300"
      >
        <div className="flex flex-col">
          <div className="flex items-start gap-4 p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              {listing.sponsor?.logo ? (
                <img
                  src={sponsorLogo}
                  alt={listing.sponsor.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {getListingIcon(listing.type ?? 'bounty')}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex min-w-0 items-center justify-start gap-2">
                {getListingIcon(
                  listing.type ?? 'bounty',
                  'h-4 w-4 flex-shrink-0',
                )}
                <Tooltip
                  content={listing.title}
                  triggerClassName="min-w-0 flex-1"
                  contentProps={{ className: 'max-w-xs break-words' }}
                >
                  <h3 className="min-w-0 flex-1 truncate text-left text-base font-medium text-slate-500">
                    {listing.title}
                  </h3>
                </Tooltip>
              </div>

              <div className="flex items-center gap-1">
                <img
                  className="h-5 w-5 rounded-full"
                  alt={'green dollar'}
                  src={tokenIcon}
                />

                {listing?.type === 'grant' && (
                  <span className="text-base font-semibold whitespace-nowrap text-slate-900">
                    {grantAmount({
                      maxReward: listing?.maxRewardAsk!,
                      minReward: listing?.minRewardAsk!,
                    })}
                  </span>
                )}
                <SponsorPrize
                  compensationType={listing?.compensationType}
                  maxRewardAsk={listing?.maxRewardAsk}
                  minRewardAsk={listing?.minRewardAsk}
                  rewardAmount={listing?.rewardAmount}
                  className="text-base font-semibold text-slate-900"
                />

                <span className="text-base font-semibold text-slate-400">
                  {listing.token}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4 border-t border-gray-100 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-400">
                {listing.type === 'bounty' ? 'Submissions' : 'Applications'}
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {submissionCount ?? '-'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-400">
                Deadline
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {formattedDeadline}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-400">Status</span>
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bgColor} ${statusColors.color}`}
              >
                {status}
              </span>
            </div>
          </div>

          <div
            className="flex gap-3 border-gray-100 p-4 pt-6"
            onClick={(e) => e.stopPropagation()}
          >
            {data.stage === SponsorStage.BOOST && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                  asChild
                >
                  <Link
                    href={`/dashboard/listings/${listing.slug}/submissions`}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    {listing.type === 'bounty' ? 'Submissions' : 'Applications'}
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                  asChild
                >
                  <Link
                    href={`/dashboard/listings/${listing.slug}/edit?boost=true`}
                  >
                    <Rocket className="mr-1 h-4 w-4" />
                    Boost
                  </Link>
                </Button>
              </>
            )}

            {data.stage === SponsorStage.BOOSTED && (
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                asChild
              >
                <Link href={`/dashboard/listings/${listing.slug}/submissions`}>
                  <Eye className="mr-1 h-4 w-4" />
                  {listing.type === 'bounty' ? 'Submissions' : 'Applications'}
                </Link>
              </Button>
            )}

            {data.stage === SponsorStage.REVIEW_AI && (
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                asChild
              >
                <Link href={`/dashboard/listings/${listing.slug}/submissions`}>
                  <Eye className="mr-1 h-4 w-4" />
                  {listing.type === 'bounty' ? 'Submissions' : 'Applications'}
                </Link>
              </Button>
            )}

            {data.stage === SponsorStage.REVIEW && (
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                asChild
              >
                <Link href={`/dashboard/listings/${listing.slug}/submissions`}>
                  Announce Winners
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}

            {data.stage === SponsorStage.REVIEW_URGENT && (
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                asChild
              >
                <Link href={`/dashboard/listings/${listing.slug}/submissions`}>
                  Announce Winners
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}

            {data.stage === SponsorStage.PAYMENT_PENDING && (
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                asChild
              >
                <Link
                  href={`/dashboard/listings/${listing.slug}/submissions?tab=payments`}
                >
                  Clear Payments
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
