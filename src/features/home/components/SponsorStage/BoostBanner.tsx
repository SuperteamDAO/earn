import { useQuery } from '@tanstack/react-query';
import { Rocket } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';

import {
  BOOST_STEP_TO_AMOUNT_USD,
  BOOST_STEPS,
} from '@/features/listing-builder/components/Form/Boost/constants';
import {
  emailEstimateQuery,
  featuredAvailabilityQuery,
} from '@/features/listing-builder/components/Form/Boost/queries';
import {
  amountToStep,
  getTotalImpressionsForValue,
  resolveEmailImpressions,
} from '@/features/listing-builder/components/Form/Boost/utils';
import type { Listing } from '@/features/listings/types';

interface BoostBannerProps {
  listing: Listing;
}

export function BoostBanner({ listing }: BoostBannerProps) {
  const { usdValue, skills, region } = listing;

  const { user } = useUser();

  const highestTier = BOOST_STEPS[BOOST_STEPS.length - 1]!;
  const BOOST_THRESHOLD = BOOST_STEP_TO_AMOUNT_USD[highestTier];

  const { data: featuredData } = useQuery(featuredAvailabilityQuery());
  const isFeatureAvailable = featuredData?.isAvailable ?? false;

  const { data: emailEstimate } = useQuery(
    emailEstimateQuery(skills, region as string | undefined),
  );
  const emailImpressions = resolveEmailImpressions(skills, emailEstimate);

  const currentStep = amountToStep(usdValue ?? 0, isFeatureAvailable);

  const allSteps = [...BOOST_STEPS];
  const currentStepIndex = allSteps.indexOf(currentStep);
  const nextStep = allSteps[currentStepIndex + 1];

  if ((usdValue ?? 0) >= BOOST_THRESHOLD || !nextStep) {
    return null;
  }

  const currentImpressions = getTotalImpressionsForValue(
    currentStep,
    emailImpressions,
    isFeatureAvailable,
  );
  const nextImpressions = getTotalImpressionsForValue(
    nextStep,
    emailImpressions,
    isFeatureAvailable,
  );

  const impressionDifference = nextImpressions - currentImpressions;

  if (impressionDifference <= 0) {
    return null;
  }

  const nextTierAmount = BOOST_STEP_TO_AMOUNT_USD[nextStep];
  const amountToAdd = nextTierAmount - (usdValue ?? 0);

  const formatImpressions = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return num.toString();
  };

  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg">
            <Rocket className="h-6 w-6 text-indigo-600" strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-700">
              Get {formatImpressions(impressionDifference)} more views once you
              add ${Math.ceil(amountToAdd)}
            </h2>
            <p className="max-w-sm text-base text-slate-500">
              Increase the total rewards of your {listing.type} to unlock more
              distribution from Superteam Earn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <Button asChild>
            <Link
              href={`/dashboard/listings/${listing.slug}/edit?boost=true`}
              onClick={() => {
                posthog.capture('boost listing_sponsor stage banner', {
                  stage: 'BOOST',
                  listing_type: listing.type,
                  listing_slug: listing.slug,
                });
                posthog.capture('click_sponsor stage banner', {
                  stage: 'BOOST',
                  listing_type: listing.type,
                  listing_slug: listing.slug,
                });
              }}
            >
              Boost {listing.type}
            </Link>
          </Button>
          <Link
            href="https://t.me/pratikdholani/"
            className="flex items-center gap-3 text-sm text-slate-400 underline underline-offset-4 hover:text-slate-700"
            onClick={() => {
              posthog.capture('get help_sponsor stage banner', {
                stage: 'BOOST',
                listing_type: listing.type,
                listing_slug: listing.slug,
              });
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
        </div>
      </div>

      <div className="pointer-events-none hidden xl:block">
        <img
          src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1761678693/assets/home/sponsor-stages/boost.webp"
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
