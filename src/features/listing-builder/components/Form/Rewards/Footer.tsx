import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { submitListingMutationAtom } from '@/features/listing-builder/atoms';
import {
  calculateTotalPrizes,
  scaleRewardsForTargetUsd,
} from '@/features/listing-builder/utils/rewards';

import { useListingForm } from '../../../hooks';
import {
  featuredAvailabilityQuery,
  tokenUsdValueQuery,
} from '../Boost/queries';
import {
  computeEstimatedUsdValue,
  hasMoreThan72HoursLeft,
  resolveTargetUsdFromBoost,
} from '../Boost/utils';
import { RewardsLabel } from './Sheet';

function RewardsFooter({
  panel,
  setPanel,
  setOpen,
  boostStep,
  isBoostFromUrl,
  proAdjustment,
}: {
  panel: 'rewards' | 'boost';
  setPanel: (panel: 'rewards' | 'boost') => void;
  setOpen: (open: boolean, options?: { bypassPrompt?: boolean }) => void;
  boostStep?: number;
  isBoostFromUrl?: boolean;
  proAdjustment?: { increasedBy: number; minRequired: number } | null;
}) {
  const form = useListingForm();
  const router = useRouter();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  const rewards = useWatch({
    control: form.control,
    name: 'rewards',
  });
  const maxBonusSpots = useWatch({
    control: form.control,
    name: 'maxBonusSpots',
  });
  const rewardAmount = useWatch({
    control: form.control,
    name: 'rewardAmount',
  });
  const token = useWatch({
    control: form.control,
    name: 'token',
  });
  const compensationType = useWatch({
    control: form.control,
    name: 'compensationType',
  });
  const minRewardAsk = useWatch({
    control: form.control,
    name: 'minRewardAsk',
  });
  const maxRewardAsk = useWatch({
    control: form.control,
    name: 'maxRewardAsk',
  });
  const deadline = useWatch({
    control: form.control,
    name: 'deadline',
  });
  const isPrivate = useWatch({
    control: form.control,
    name: 'isPrivate',
  });

  const { data: featuredData } = useQuery(featuredAvailabilityQuery());
  const isFeatureAvailable = featuredData?.isAvailable ?? true;

  const totalPrize = useMemo(
    () => calculateTotalPrizes(rewards, maxBonusSpots || 0),
    [type, maxBonusSpots, rewards],
  );

  const deadlineMoreThan72HoursLeft = hasMoreThan72HoursLeft(deadline);
  const submitListingMutation = useAtomValue(submitListingMutationAtom);

  const { data: tokenUsdValueData } = useQuery(
    tokenUsdValueQuery(token as string | undefined),
  );
  const tokenUsdValue =
    typeof tokenUsdValueData === 'number' ? tokenUsdValueData : 1;

  const totalUsdPrize = useMemo(() => {
    if (type !== 'project') return (tokenUsdValue || 1) * (rewardAmount || 0);
    else {
      if (compensationType === 'fixed')
        return (tokenUsdValue || 1) * (rewardAmount || 0);
      else if (compensationType === 'range')
        return (
          (tokenUsdValue || 1) *
          (((minRewardAsk || 0) + (maxRewardAsk || 0)) / 2)
        );
      else if (compensationType === 'variable') return 1000;
    }
    return 0;
  }, [
    tokenUsdValue,
    rewardAmount,
    type,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
  ]);

  const prevRewardAmountTokens = Number(rewardAmount) || 0;
  const targetBoostTokens = useMemo(() => {
    if (panel !== 'boost') return prevRewardAmountTokens;
    const estimatedUsdValue = computeEstimatedUsdValue(
      rewardAmount,
      tokenUsdValue,
    );
    const targetUSD = resolveTargetUsdFromBoost(
      boostStep ?? 0,
      estimatedUsdValue,
      isFeatureAvailable,
    );
    const usd = tokenUsdValue || 1;
    return targetUSD / usd;
  }, [
    boostStep,
    isFeatureAvailable,
    panel,
    prevRewardAmountTokens,
    rewardAmount,
    tokenUsdValue,
  ]);
  const boostIncreasesReward = useMemo(
    () =>
      panel !== 'boost' ? true : targetBoostTokens > prevRewardAmountTokens,
    [panel, prevRewardAmountTokens, targetBoostTokens],
  );

  return (
    <div className="w-full space-y-4 bg-white">
      {proAdjustment && panel === 'rewards' && (
        <div className="mr-4 flex rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mr-6 flex h-fit items-center justify-center rounded-full bg-slate-300 px-3 py-1">
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.90271 7.78565C3.77992 7.78565 3.67614 7.69673 3.6464 7.57761C3.55162 7.19795 3.37019 6.79418 3.10209 6.3664C2.78445 5.85274 2.33164 5.3763 1.74366 4.93699C1.23227 4.55048 0.720877 4.28689 0.209488 4.14628C0.088369 4.113 0 4.0056 0 3.87998C0 3.75683 0.0849698 3.65067 0.203389 3.61686C0.704776 3.4737 1.18779 3.24128 1.65242 2.91962C2.18633 2.54791 2.63239 2.10185 2.99058 1.58146C3.30745 1.11788 3.52498 0.659397 3.64315 0.206011C3.6741 0.0872362 3.77867 0 3.90143 0C4.02553 0 4.13083 0.0891682 4.16104 0.209562C4.22924 0.481363 4.33583 0.759568 4.48079 1.04417C4.66329 1.3956 4.89643 1.73352 5.1803 2.05793C5.47089 2.37557 5.79532 2.6628 6.1535 2.91962C6.62157 3.25141 7.09739 3.48451 7.58104 3.61892C7.69969 3.65189 7.78565 3.75752 7.78565 3.88065C7.78565 4.00564 7.69708 4.11214 7.57656 4.14519C7.27 4.22924 6.95445 4.36479 6.62998 4.55176C6.23798 4.78155 5.87302 5.05526 5.53509 5.37291C5.19719 5.68379 4.9201 6.01157 4.70381 6.35624C4.43521 6.78492 4.25357 7.1918 4.15897 7.57695C4.12962 7.69642 4.02568 7.78565 3.90271 7.78565Z"
                fill="#314158"
              />
            </svg>
            <p className="text-xxs ml-1 font-medium text-slate-700">PRO</p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            We increased your prize by $
            {proAdjustment.increasedBy.toLocaleString()} to meet the $
            {proAdjustment.minRequired.toLocaleString()} cap for the PRO
            Listing.
          </p>
        </div>
      )}
      {!!tokenUsdValue && totalUsdPrize <= 100 && panel === 'rewards' && (
        <p className="text-[0.8rem] text-yellow-600">
          {`Note: This listing will not show up on Earn's Landing Page since it is ≤$100 in value. Increase the total compensation for better discoverability.`}
        </p>
      )}
      <div className="flex items-center justify-between text-sm font-medium">
        {type !== 'project' ? (
          <span className="flex gap-2">
            <p className="">{totalPrize}</p>
            <p className="text-slate-400">
              Total {totalPrize > 1 ? 'Prizes' : 'Prize'}
            </p>
          </span>
        ) : (
          <p className="text-slate-400">Total Prize</p>
        )}
        <div className="flex">
          <RewardsLabel hideCompensationType />
        </div>
      </div>
      {panel === 'boost' && (
        <div>
          <Button
            type="button"
            className="w-full"
            disabled={
              !boostIncreasesReward ||
              (isBoostFromUrl
                ? submitListingMutation.isPending ||
                  submitListingMutation.isSuccess
                : false)
            }
            onClick={async () => {
              if (await form.validateRewards()) {
                const targetUSD = targetBoostTokens * (tokenUsdValue || 1);
                const { rewardAmountTokens, rewardsToPersist } =
                  scaleRewardsForTargetUsd({
                    rewards,
                    maxBonusSpots,
                    targetUsd: targetUSD,
                    tokenUsdValue: tokenUsdValue || 1,
                    shouldScalePodium: true,
                    shouldRoundToNearestTen: (tokenUsdValue || 0) <= 10,
                  });

                if (rewardsToPersist) {
                  form.setValue('rewards', rewardsToPersist, {
                    shouldValidate: false,
                  });
                }

                const prevTokens = prevRewardAmountTokens;
                if (rewardAmountTokens > prevTokens) {
                  posthog.capture('boost_listing');
                }

                form.setValue('rewardAmount', rewardAmountTokens, {
                  shouldValidate: false,
                });
                if (isBoostFromUrl) {
                  const isValid = await form.trigger();
                  if (isValid) {
                    try {
                      await form.submitListing();
                      toast.success('Listing boosted and rewards updated.', {
                        description: 'Redirecting to the listing page.',
                      });
                      posthog.capture('update listing_sponsor');
                      router.push('/dashboard/listings');
                    } catch (error) {
                      console.log(error);
                      toast.error(
                        'Failed to update listing, please try again later',
                        {},
                      );
                    }
                  }
                } else {
                  await form.trigger(['rewards', 'rewardAmount'] as any);
                  form.saveDraft();
                  setOpen(false, { bypassPrompt: true });
                }
              } else {
                toast.warning(
                  'Please resolve all errors in Rewards to Continue',
                );
              }
            }}
          >
            {isBoostFromUrl ? (
              submitListingMutation.isPending ||
              submitListingMutation.isSuccess ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Rewards...
                </span>
              ) : (
                <span>Update Rewards</span>
              )
            ) : (
              'Continue'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full text-slate-500"
            onClick={async () => {
              setOpen(false, { bypassPrompt: true });
            }}
          >
            Skip
          </Button>
        </div>
      )}

      {panel === 'rewards' && (
        <Button
          type="button"
          className="w-full"
          onClick={async () => {
            if (await form.validateRewards()) {
              if (proAdjustment) {
                setOpen(false, { bypassPrompt: true });
                return;
              }
              if (
                compensationType === 'fixed' &&
                deadlineMoreThan72HoursLeft &&
                type !== 'hackathon' &&
                !isPrivate
              ) {
                setPanel('boost');
              } else {
                setOpen(false, { bypassPrompt: true });
              }
            } else {
              toast.warning('Please resolve all errors in Rewards to Continue');
            }
          }}
        >
          Continue
        </Button>
      )}
    </div>
  );
}
export { RewardsFooter as Footer };
