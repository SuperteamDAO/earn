import { useQuery } from '@tanstack/react-query';
import { differenceInHours } from 'date-fns';
import { RocketIcon } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

const BoostArrow = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    className="absolute -bottom-4 left-2 fill-slate-800 stroke-slate-800 stroke-1"
    style={{ filter: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))' }}
  >
    <path d="M6 0L12 6H0L6 0Z" />
  </svg>
);

import { type Listing } from '@/features/listings/types';

import { BOOST_STEP_TO_AMOUNT_USD } from './constants';
import { emailEstimateQuery, featuredAvailabilityQuery } from './queries';
import {
  amountToStep,
  getAllowedMaxStep,
  getTotalImpressionsForValue,
  hasMoreThan72HoursLeft,
  resolveEmailImpressions,
} from './utils';

export const BoostButton = ({
  listing,
  showDate = true,
}: {
  listing?: Listing;
  showDate?: boolean;
}) => {
  const { data: featuredData } = useQuery({
    ...featuredAvailabilityQuery(),
    enabled: !!listing,
  });
  const isFeatureAvailable = featuredData?.isAvailable ?? false;

  const { data: emailEstimate } = useQuery({
    ...emailEstimateQuery(
      listing?.skills,
      listing?.region as string | undefined,
    ),
    enabled: !!listing,
  });

  if (!listing) return null;

  const {
    deadline,
    usdValue,
    skills,
    slug,
    compensationType,
    type,
    isPrivate,
  } = listing;

  const deadlineMoreThan72HoursLeft = hasMoreThan72HoursLeft(deadline ?? '');

  const currentStep = amountToStep(usdValue ?? 0, isFeatureAvailable);
  const maxAvailableStep = getAllowedMaxStep(isFeatureAvailable);
  const canBeBoosted = currentStep < maxAvailableStep;

  const emailImpressions = resolveEmailImpressions(skills, emailEstimate);

  const isUnderMin =
    typeof usdValue === 'number' && usdValue < BOOST_STEP_TO_AMOUNT_USD[0];

  const currentImpressions = isUnderMin
    ? 0
    : getTotalImpressionsForValue(
        currentStep,
        emailImpressions,
        isFeatureAvailable,
      );

  const maxStep = getAllowedMaxStep(isFeatureAvailable);

  const maxImpressions = getTotalImpressionsForValue(
    maxStep,
    emailImpressions,
    isFeatureAvailable,
  );
  const additionalImpressions = maxImpressions - currentImpressions;

  if (
    deadlineMoreThan72HoursLeft &&
    canBeBoosted &&
    compensationType === 'fixed' &&
    type !== 'hackathon' &&
    !isPrivate
  ) {
    const deadlineDate = new Date(deadline ?? '');
    const seventyTwoHoursBeforeDeadline = new Date(
      deadlineDate.getTime() - 72 * 60 * 60 * 1000,
    );
    const hoursUntilSeventyTwoHoursLeft = differenceInHours(
      seventyTwoHoursBeforeDeadline,
      new Date(),
    );

    const timeFormatted =
      hoursUntilSeventyTwoHoursLeft >= 24
        ? `${Math.floor(hoursUntilSeventyTwoHoursLeft / 24)}d`
        : `${hoursUntilSeventyTwoHoursLeft}h`;

    if (showDate) {
      return (
        <div className="relative hidden sm:block">
          <Tooltip
            content={`Reach ${additionalImpressions.toLocaleString()} more people`}
            open={true}
            onOpenChange={() => {}}
            contentProps={{
              side: 'bottom',
              align: 'start',
              className: 'bg-slate-800 text-white border-slate-800 relative',
            }}
          >
            <Link href={`/dashboard/listings/${slug}/edit?boost=true`}>
              <Button
                variant="outline"
                className="border-slate-300 shadow"
                onClick={() => posthog.capture('clicked_boost cta')}
              >
                <RocketIcon className="text-emerald-500" />
                <p className="mr-2 font-semibold text-slate-600">Boost</p>
                <p className="text-slate-400">{timeFormatted} Remaining</p>
              </Button>
            </Link>
          </Tooltip>
          <BoostArrow />
        </div>
      );
    } else {
      return (
        <Link
          href={`/dashboard/listings/${slug}/edit?boost=true`}
          className="hidden sm:block"
        >
          <Button
            variant="outline"
            className="rounded-lg border-slate-300 px-2"
            size="sm"
            onClick={() => posthog.capture('clicked_boost cta')}
          >
            <RocketIcon className="text-emerald-500" />
            <p className="font-semibold text-slate-600">Boost</p>
          </Button>
        </Link>
      );
    }
  }
  return null;
};
