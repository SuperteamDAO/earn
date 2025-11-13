import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';

import { type Listing } from '@/features/listings/types';

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
      href={`/dashboard/listings/${listing.slug}/submissions`}
      className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-8"
      onClick={handleReviewWithAiClick}
      prefetch={false}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg">
            <Sparkles className="h-6 w-6 text-indigo-600" strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-700">
              Need help with reviewing?
            </h2>
            <p className="max-w-sm text-base text-slate-500">
              Use AI to quickly review your{' '}
              {label[listing.type as keyof typeof label]} and save tens of hours
              in review time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <Button>Review with AI</Button>
          <Button
            variant="ghost"
            asChild
            className="flex items-center gap-3 text-sm text-slate-400 underline underline-offset-4 hover:text-slate-700"
          >
            <Link
              href="https://t.me/pratikdholani/"
              onClick={(e) => {
                e.stopPropagation();
                handleGetHelpClick();
              }}
            >
              <img
                src="/assets/sponsor/pratik.webp"
                alt="Get Help"
                width={28}
                height={28}
              />
              <span>Get Help</span>
            </Link>
          </Button>
        </div>
      </div>

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
