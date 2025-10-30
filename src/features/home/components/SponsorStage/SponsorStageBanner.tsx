'use client';

import { useQuery } from '@tanstack/react-query';

import { useBreakpoint } from '@/hooks/use-breakpoint';

import { sponsorStageQuery } from '@/features/home/queries/sponsor-stage';
import { SponsorStage } from '@/features/home/types/sponsor-stage';

import { BoostBanner } from './BoostBanner';
import { BoostedBanner } from './BoostedBanner';
import { NewSponsorBanner } from './NewSponsorBanner';
import { NextListingBanner } from './NextListingBanner';
import { PaymentPendingBanner } from './PaymentPendingBanner';
import { ReviewAiBanner } from './ReviewAiBanner';
import { ReviewBanner } from './ReviewBanner';
import { ReviewUrgentBanner } from './ReviewUrgentBanner';

export function SponsorStageBanner() {
  const isLg = useBreakpoint('lg');

  const { data, isLoading } = useQuery({
    ...sponsorStageQuery,
    enabled: false,
  });

  if (isLoading || !data || !data.stage || !isLg) {
    return null;
  }

  const { stage, listing } = data;

  switch (stage) {
    case SponsorStage.NEW_SPONSOR:
      return <NewSponsorBanner />;

    case SponsorStage.BOOST:
      return listing ? <BoostBanner listing={listing} /> : null;

    case SponsorStage.BOOSTED:
      return listing ? <BoostedBanner listing={listing} /> : null;

    case SponsorStage.REVIEW_AI:
      return listing ? <ReviewAiBanner listing={listing} /> : null;

    case SponsorStage.REVIEW:
      return listing ? <ReviewBanner listing={listing} /> : null;

    case SponsorStage.REVIEW_URGENT:
      return listing ? <ReviewUrgentBanner listing={listing} /> : null;

    case SponsorStage.PAYMENT_PENDING:
      return listing ? <PaymentPendingBanner listing={listing} /> : null;

    case SponsorStage.NEXT_LISTING:
      return <NextListingBanner />;

    default:
      return null;
  }
}
