import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { dayjs } from '@/utils/dayjs';

import { type Listing } from '@/features/listings/types';

import { SponsorStageBannerContent } from './SponsorStageBannerContent';

interface ReviewUrgentBannerProps {
  listing: Listing;
}

export function ReviewUrgentBanner({ listing }: ReviewUrgentBannerProps) {
  const handleAnnounceWinnersClick = () => {
    posthog.capture('announce winners_sponsor stage banner', {
      stage: 'REVIEW_URGENT',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
    posthog.capture('click_sponsor stage banner', {
      stage: 'REVIEW_URGENT',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
  };

  const handleGetHelpClick = () => {
    posthog.capture('get help_sponsor stage banner', {
      stage: 'REVIEW_URGENT',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
  };

  return (
    <Link
      href={`/earn/dashboard/listings/${listing.slug}/submissions`}
      className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-8"
      onClick={handleAnnounceWinnersClick}
      prefetch={false}
    >
      <SponsorStageBannerContent
        icon={<ShieldAlert className="h-6 w-6 text-red-600" strokeWidth={2} />}
        title="Announce winners of your latest listing"
        description={
          <>
            You are past your commitment date of{' '}
            {dayjs(listing.commitmentDate).format('Do MMM')}. Announce winners
            now to avoid losing credibility.
          </>
        }
        ctaLabel="Announce Winners"
        onGetHelpClick={handleGetHelpClick}
      />

      <div className="absolute -right-26 -bottom-32 hidden xl:block">
        <span className="block size-100 rounded-full bg-indigo-100/80" />
      </div>
      <div className="absolute top-2/4 right-14 hidden w-49 -translate-y-1/2 xl:block">
        <img
          src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1761682347/assets/home/sponsor-stages/review.webp"
          alt="Review your latest listing"
          className="object-contain object-right"
        />
      </div>
    </Link>
  );
}
