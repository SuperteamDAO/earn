'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { sponsorStageQuery } from '@/features/home/queries/sponsor-stage';
import { SponsorStage } from '@/features/home/types/sponsor-stage';

export function SponsorStageSnackbar() {
  const router = useRouter();
  const { user } = useUser();
  const isLg = useBreakpoint('lg');

  const isHomepage = router.asPath === '/' || router.pathname === '/';

  const { data, isLoading, refetch } = useQuery({
    ...sponsorStageQuery,
    enabled: !!user?.currentSponsorId && isLg && isHomepage,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (isHomepage && !!user?.currentSponsorId && isLg) {
      refetch();
    }
  }, [isHomepage, user?.currentSponsorId, isLg, refetch]);

  if (
    !isHomepage ||
    isLoading ||
    !data ||
    !data.stage ||
    !data.listing ||
    !isLg
  ) {
    return null;
  }

  const { stage, listing } = data;

  if (
    stage !== SponsorStage.REVIEW &&
    stage !== SponsorStage.REVIEW_AI &&
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
        href={`/dashboard/listings/${listing.slug}/submissions?tab=payments`}
        className={cn(
          'flex w-full items-center justify-center bg-amber-50 px-6 py-3 text-amber-700 transition-colors hover:bg-amber-100',
          'gap-2 lg:flex',
        )}
      >
        <p className="text-sm font-normal">
          Please complete your payment or add your payment links for your latest
          bounty
        </p>
        <ArrowUpRight className="size-4 flex-shrink-0" />
      </Link>
    );
  }

  if (!listing.commitmentDate) {
    return null;
  }

  if (stage === SponsorStage.REVIEW_URGENT) {
    const daysPast = dayjs().diff(dayjs(listing.commitmentDate), 'day');
    const hoursPast = dayjs().diff(dayjs(listing.commitmentDate), 'hour');

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
        href={`/dashboard/listings/${listing.slug}/submissions`}
        className={cn(
          'flex w-full items-center justify-center bg-red-100 px-6 py-3 text-orange-900 transition-colors hover:bg-red-200',
          'gap-2 lg:flex',
        )}
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

  return (
    <Link
      href={`/dashboard/listings/${listing.slug}/submissions`}
      className={cn(
        'flex w-full items-center justify-center bg-violet-50 px-6 py-3 text-indigo-700 transition-colors hover:bg-violet-100',
        'gap-2 lg:flex',
      )}
    >
      <p className="text-sm font-normal">
        People are waiting for the winners to be finalised — please announce the
        winners before{' '}
        <span className="font-bold">{commitmentDateFormatted}</span>
      </p>
      <ArrowUpRight className="size-4 flex-shrink-0" />
    </Link>
  );
}
