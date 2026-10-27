import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { type Listing } from '@/features/listings/types';

import { SponsorStageBannerContent } from './SponsorStageBannerContent';

interface ReviewAiBannerProps {
  listing: Listing;
}

export function ReviewAiBanner({ listing }: ReviewAiBannerProps) {
  const label = {
    bounty: 'Bounty submissions',
    project: 'Project applications',
    grant: 'Grant applications',
  };

  const handleReviewWithAiClick = () => {
    posthog.capture('review with ai_sponsor stage banner', {
      stage: 'REVIEW_AI',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
    posthog.capture('click_sponsor stage banner', {
      stage: 'REVIEW_AI',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
  };

  const handleGetHelpClick = () => {
    posthog.capture('get help_sponsor stage banner', {
      stage: 'REVIEW_AI',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
  };

  return (
    <Link
      href={`/earn/dashboard/listings/${listing.slug}/submissions`}
      className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-8"
      onClick={handleReviewWithAiClick}
      prefetch={false}
    >
      <SponsorStageBannerContent
        icon={<Sparkles className="h-6 w-6 text-indigo-600" strokeWidth={2} />}
        title="Need help with reviewing?"
        description={
          <>
            Use AI to quickly review your{' '}
            {label[listing.type as keyof typeof label]} and save tens of hours
            in review time
          </>
        }
        ctaLabel="Review with AI"
        onGetHelpClick={handleGetHelpClick}
      />

      <div className="absolute -right-26 -bottom-32 hidden xl:block">
        <span className="block size-100 rounded-full bg-indigo-100/80" />
      </div>
      <div className="absolute top-2/4 right-10 hidden w-79 -translate-y-1/2 xl:block">
        <img
          src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1761683429/assets/home/sponsor-stages/review-ai.webp"
          alt="Review your listing with AI"
          className="object-contain object-right"
        />
      </div>
    </Link>
  );
}
