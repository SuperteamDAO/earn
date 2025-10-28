import { Rocket } from 'lucide-react';

import { useUser } from '@/store/user';

import { type Listing } from '@/features/listings/types';

interface BoostedBannerProps {
  listing: Listing;
}

export function BoostedBanner({ listing }: BoostedBannerProps) {
  const { user } = useUser();

  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-16">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg">
            <Rocket className="h-6 w-6 text-green-600" strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-700">
              Your boost is active
            </h2>
            <p className="max-w-sm text-base text-slate-500">
              You&apos;re in highest Boost tier. Your
              {listing.type} will reach thousands of more Earn users.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden xl:block">
        <img
          src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1761678693/assets/home/sponsor-stages/boosted.webp"
          alt="Boost your listing"
          className="absolute top-0 right-0 h-full object-cover object-right"
        />
        <img
          src={user?.currentSponsor?.logo ?? ''}
          alt={user?.currentSponsor?.name ?? ''}
          className="absolute top-5/9 right-9 size-28 -translate-y-1/2 rounded-full"
        />
      </div>
    </div>
  );
}
