import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';

import { type Listing } from '@/features/listings/types';

interface PaymentPendingBannerProps {
  listing: Listing;
}

export function PaymentPendingBanner({ listing }: PaymentPendingBannerProps) {
  const handleClearPaymentsClick = () => {
    posthog.capture('clear payments_sponsor stage banner', {
      stage: 'PAYMENT_PENDING',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
    posthog.capture('click_sponsor stage banner', {
      stage: 'PAYMENT_PENDING',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
  };

  const handleGetHelpClick = () => {
    posthog.capture('get help_sponsor stage banner', {
      stage: 'PAYMENT_PENDING',
      listing_type: listing.type,
      listing_slug: listing.slug,
    });
  };

  return (
    <Link
      href={`/dashboard/listings/${listing.slug}/submissions?tab=payments`}
      className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-8"
      onClick={handleClearPaymentsClick}
      prefetch={false}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg">
            <TriangleAlert className="h-6 w-6 text-slate-600" strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-700">
              Please clear your payment
            </h2>
            <p className="max-w-md text-base text-slate-500">
              You need to pay or add your transaction links for the payments
              made to the winners of your latest {listing.type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <Button>Clear Payments</Button>
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
      <div className="absolute top-2/4 right-10 hidden w-49 -translate-y-1/2 xl:block">
        <img
          src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1761684250/assets/home/sponsor-stages/logos.webp"
          alt="Sponsor logos"
          className="object-contain object-right"
        />
      </div>
    </Link>
  );
}
