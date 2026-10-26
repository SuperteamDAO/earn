'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { posthog } from 'posthog-js';

import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { SponsorStage } from '@/features/home/types/sponsor-stage';
import type { Listing } from '@/features/listings/types';

// The homepage's snackbar under the header for a sponsor with winners or
// payments due; loaded by SponsorStageSnackbar on the server. `now`: the
// server's clock then.
export function SponsorStageSnackbarView({
  stage,
  listing,
  now,
}: {
  stage: SponsorStage | null;
  listing: Listing | null;
  now: number;
}) {
  if (!stage || !listing) {
    return null;
  }

  if (
    stage !== SponsorStage.REVIEW &&
    stage !== SponsorStage.REVIEW_URGENT &&
    stage !== SponsorStage.PAYMENT_PENDING
  ) {
    return null;
  }

  if (!listing.slug) {
    return null;
  }

  if (stage === SponsorStage.PAYMENT_PENDING) {
    return (
      <Link
        href={`/earn/dashboard/listings/${listing.slug}/submissions?tab=payments`}
        className={cn(
          'flex w-full items-center justify-center bg-amber-50 px-6 py-3 text-amber-700 transition-colors hover:bg-amber-100',
          'gap-2 lg:flex',
        )}
        onClick={() => {
          posthog.capture('clear payments_sponsor stage snackbar', {
            stage: 'PAYMENT_PENDING',
            listing_type: listing.type,
            listing_slug: listing.slug,
          });
          posthog.capture('click_sponsor stage snackbar', {
            stage: 'PAYMENT_PENDING',
            listing_type: listing.type,
            listing_slug: listing.slug,
          });
        }}
      >
        <p className="text-sm font-normal">
          Please complete your payment or add your payment links for your latest
          bounty
        </p>
        <ArrowUpRight className="size-4 shrink-0" />
      </Link>
    );
  }

  if (!listing.commitmentDate) {
    return null;
  }

  if (stage === SponsorStage.REVIEW_URGENT) {
    const daysPast = dayjs(now).diff(dayjs(listing.commitmentDate), 'day');
    const hoursPast = dayjs(now).diff(dayjs(listing.commitmentDate), 'hour');

    const timeDisplay =
      daysPast === 0 ? (
        <span>
          {hoursPast} {hoursPast === 1 ? 'hour' : 'hours'} ago
        </span>
      ) : (
        <span>
          {daysPast} {daysPast === 1 ? 'day' : 'days'} ago
        </span>
      );

    return (
      <Link
        href={`/earn/dashboard/listings/${listing.slug}/submissions`}
        className={cn(
          'flex w-full items-center justify-center bg-red-100 px-6 py-3 text-orange-900 transition-colors hover:bg-red-200',
          'gap-2 lg:flex',
        )}
        onClick={() => {
          posthog.capture('announce winners_sponsor stage snackbar', {
            stage: 'REVIEW_URGENT',
            listing_type: listing.type,
            listing_slug: listing.slug,
          });
          posthog.capture('click_sponsor stage snackbar', {
            stage: 'REVIEW_URGENT',
            listing_type: listing.type,
            listing_slug: listing.slug,
          });
        }}
      >
        <p className="text-sm font-normal">
          Your commitment to announce winners was {timeDisplay}
          {' - '}
          <span className="font-bold">please announce winners ASAP</span>
        </p>
        <ArrowUpRight className="size-4 shrink-0" />
      </Link>
    );
  }

  const commitmentDateFormatted = dayjs(listing.commitmentDate).format(
    'Do MMM',
  );

  const handleSnackbarClick = () => {
    const stageValue = 'REVIEW';
    posthog.capture('announce winners_sponsor stage snackbar', {
      stage: stageValue,
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
    posthog.capture('click_sponsor stage snackbar', {
      stage: stageValue,
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
  };

  return (
    <Link
      href={`/earn/dashboard/listings/${listing.slug}/submissions`}
      className={cn(
        'flex w-full items-center justify-center bg-violet-50 px-6 py-3 text-indigo-700 transition-colors hover:bg-violet-100',
        'gap-2 lg:flex',
      )}
      onClick={handleSnackbarClick}
    >
      <p className="text-sm font-normal">
        People are waiting for the winners to be finalised — please announce the
        winners before{' '}
        <span className="font-bold">{commitmentDateFormatted}</span>
      </p>
      <ArrowUpRight className="size-4 shrink-0" />
    </Link>
  );
}
