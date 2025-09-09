import { useQuery } from '@tanstack/react-query';
import { differenceInHours } from 'date-fns';
import { RocketIcon } from 'lucide-react';
import Link from 'next/link';

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

import { DEFAULT_EMAIL_IMPRESSIONS } from './constants';
import { featuredAvailabilityQuery } from './queries';
import {
  amountToStep,
  calculateTotalImpressions,
  hasMoreThan72HoursLeft,
} from './utils';

export const BoostButton = ({
  deadline,
  usdValue,
  slug,
}: {
  deadline: string;
  usdValue: number;
  slug: string;
}) => {
  const deadlineMoreThan72HoursLeft = hasMoreThan72HoursLeft(deadline);

  const { data: featuredData } = useQuery(featuredAvailabilityQuery());
  const isFeatureAvailable = featuredData?.isAvailable ?? false;

  const currentStep = amountToStep(usdValue, isFeatureAvailable);
  const maxAvailableStep = isFeatureAvailable ? 75 : 50;
  const canBeBoosted = currentStep < maxAvailableStep;

  const currentImpressions = calculateTotalImpressions(
    currentStep,
    DEFAULT_EMAIL_IMPRESSIONS,
    isFeatureAvailable,
  );

  const nextStep = currentStep === 0 ? 25 : currentStep === 25 ? 50 : 75;

  const nextImpressions = calculateTotalImpressions(
    nextStep,
    DEFAULT_EMAIL_IMPRESSIONS,
    isFeatureAvailable,
  );
  const additionalImpressions = nextImpressions - currentImpressions;

  if (deadlineMoreThan72HoursLeft && canBeBoosted) {
    const deadlineDate = new Date(deadline);
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

    return (
      <div className="relative">
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
            <Button variant="outline" className="border-slate-300 shadow">
              <RocketIcon className="text-emerald-500" />
              <p className="mr-2 font-semibold text-slate-600">Boost</p>
              <p className="text-slate-400">{timeFormatted} Remaining</p>
            </Button>
          </Link>
        </Tooltip>
        <BoostArrow />
      </div>
    );
  }
  return null;
};
