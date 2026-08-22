import { ClockFading } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import { JTTG } from '@/constants/Telegram';
import { useUser } from '@/store/user';

import { type Listing } from '@/features/listings/types';

interface UnderVerificationBannerProps {
  listing: Listing;
}

export function UnderVerificationBanner({
  listing,
}: UnderVerificationBannerProps) {
  const { user } = useUser();

  const handleViewDashboardClick = () => {
    posthog.capture('view dashboard_sponsor stage banner', {
      stage: 'UNDER_VERIFICATION',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
    posthog.capture('click_sponsor stage banner', {
      stage: 'UNDER_VERIFICATION',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
  };

  const handleGetHelpClick = () => {
    posthog.capture('get help_sponsor stage banner', {
      stage: 'UNDER_VERIFICATION',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
  };

  return (
    <Link
      href="/earn/dashboard/listings"
      className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-8"
      onClick={handleViewDashboardClick}
      prefetch={false}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg">
            <ClockFading className="h-6 w-6 text-amber-600" strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-700">
              Your {listing.type} is under verification
            </h2>
            <p className="max-w-sm text-base text-slate-500">
              Our team is reviewing your {listing.type}. We&apos;ll notify you
              once it&apos;s approved and published via email.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <Button variant="outline">View Dashboard</Button>
          <Button
            variant="ghost"
            asChild
            className="flex items-center gap-3 text-sm text-slate-400 underline underline-offset-4 hover:text-slate-700"
          >
            <Link
              href={JTTG}
              onClick={(e) => {
                e.stopPropagation();
                handleGetHelpClick();
              }}
            >
              <img
                src="/assets/sponsor/jill.png"
                alt="Get Help"
                width={28}
                height={28}
              />
              <span>Get Help</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="pointer-events-none hidden xl:block">
        <span className="absolute top-4/9 right-25 size-28 -translate-y-1/2">
          <img
            src={user?.currentSponsor?.logo ?? ''}
            alt={user?.currentSponsor?.name ?? ''}
            className="relative z-10 size-28"
          />
        </span>
      </div>
    </Link>
  );
}
