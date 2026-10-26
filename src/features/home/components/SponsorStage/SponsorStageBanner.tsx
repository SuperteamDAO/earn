import 'server-only';

import * as Effect from 'effect/Effect';

import { getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as SponsorStages from '@/server/sponsor-stage';

import { SponsorStage } from '@/features/home/types/sponsor-stage';

import { NewSponsorBanner } from './NewSponsorBanner';
import { NextListingBanner } from './NextListingBanner';
import { PaymentPendingBanner } from './PaymentPendingBanner';
import { ReviewBanner } from './ReviewBanner';
import { ReviewUrgentBanner } from './ReviewUrgentBanner';
import { UnderVerificationBanner } from './UnderVerificationBanner';

// The homepage's banner for a sponsor: what to do next (Earn rendered it
// inside a `hidden lg:block` wrapper, as the page still does).
export async function SponsorStageBanner() {
  const viewer = await getViewer();
  const sponsorId = viewer?.currentSponsorId;
  if (!sponsorId) return null;
  const data = await runtime.runPromise(
    SponsorStages.SponsorStages.use((stages) => stages.stage(sponsorId)).pipe(
      Effect.orElseSucceed(() => null),
    ),
  );

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
