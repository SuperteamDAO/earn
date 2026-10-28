import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { type Listing } from '@/features/listings/types';

import { SponsorStageBannerContent } from './SponsorStageBannerContent';

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
      href={`/earn/dashboard/listings/${listing.slug}/submissions?tab=payments`}
      className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-8"
      onClick={handleClearPaymentsClick}
      prefetch={false}
    >
      <SponsorStageBannerContent
        icon={
          <TriangleAlert className="h-6 w-6 text-slate-600" strokeWidth={2} />
        }
        title="Please clear your payment"
        description={
          <>
            You need to pay or add your transaction links for the payments made
            to the winners of your latest {listing.type}
          </>
        }
        descriptionMaxWidth="max-w-md"
        ctaLabel="Clear Payments"
        onGetHelpClick={handleGetHelpClick}
      />

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
