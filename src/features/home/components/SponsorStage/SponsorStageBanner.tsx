'use client';

import { useQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUser } from '@/store/user';

import { sponsorStageQuery } from '@/features/home/queries/sponsor-stage';
import { SponsorStage } from '@/features/home/types/sponsor-stage';

import { NewSponsorBanner } from './NewSponsorBanner';
import { NextListingBanner } from './NextListingBanner';
import { PaymentPendingBanner } from './PaymentPendingBanner';
import { ReviewBanner } from './ReviewBanner';
import { ReviewUrgentBanner } from './ReviewUrgentBanner';
import { UnderVerificationBanner } from './UnderVerificationBanner';

// Rendered inside a `hidden lg:block` wrapper, so the skeleton holds the
// banner's space from SSR until the sponsor stage arrives.
export function SponsorStageBanner() {
  const isLg = useBreakpoint('lg');
  const { user } = useUser();

  const { data, isPending } = useQuery({
    ...sponsorStageQuery,
    enabled: isLg && !!user?.currentSponsorId,
  });

  if (isPending) {
    return <Skeleton className="h-63 w-full rounded-xl" />;
  }

  if (!data || !data.stage) {
    return null;
  }

  const { stage, listing } = data;

  switch (stage) {
    case SponsorStage.NEW_SPONSOR:
      return <NewSponsorBanner />;

    case SponsorStage.REVIEW:
      return listing ? <ReviewBanner listing={listing} /> : null;

    case SponsorStage.REVIEW_URGENT:
      return listing ? <ReviewUrgentBanner listing={listing} /> : null;

    case SponsorStage.PAYMENT_PENDING:
      return listing ? <PaymentPendingBanner listing={listing} /> : null;

    case SponsorStage.UNDER_VERIFICATION:
      return listing ? <UnderVerificationBanner listing={listing} /> : null;

    case SponsorStage.NEXT_LISTING:
      return <NextListingBanner />;

    default:
      return null;
  }
}
