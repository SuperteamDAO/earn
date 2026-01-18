import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import { dayjs } from '@/utils/dayjs';

import { type Listing } from '@/features/listings/types';

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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg">
            <ShieldAlert className="h-6 w-6 text-red-600" strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-700">
              Announce winners of your latest listing
            </h2>
            <p className="max-w-sm text-base text-slate-500">
              You are past your commitment date of{' '}
              {dayjs(listing.commitmentDate).format('Do MMM')}. Announce winners
              now to avoid losing credibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <Button>Announce Winners</Button>
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
