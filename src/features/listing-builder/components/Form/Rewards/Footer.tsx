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
  calculateTotalRewardsForPodium,
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
}: {
  panel: 'rewards' | 'boost';
  setPanel: (panel: 'rewards' | 'boost') => void;
  setOpen: (open: boolean) => void;
  boostStep?: number;
  isBoostFromUrl?: boolean;
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

  return (
    <div className="w-full space-y-4 bg-white">
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
              isBoostFromUrl
                ? submitListingMutation.isPending ||
                  submitListingMutation.isSuccess
                : false
            }
            onClick={async () => {
              if (await form.validateRewards()) {
                const estimatedUsdValue = computeEstimatedUsdValue(
                  rewardAmount,
                  tokenUsdValue,
                );
                const targetUSD = resolveTargetUsdFromBoost(
                  boostStep ?? 0,
                  estimatedUsdValue,
                  isFeatureAvailable,
                );

                const currentRewards = (rewards || {}) as Record<
                  string,
                  number
                >;
                const usd = tokenUsdValue || 1;
                const newTotalTokens = targetUSD / usd;

                let computedRewardAmountTokens = newTotalTokens;

                if (currentRewards && Object.keys(currentRewards).length > 0) {
                  const oldTotal = calculateTotalRewardsForPodium(
                    currentRewards,
                    (maxBonusSpots as number) || 0,
                  );
                  if (oldTotal > 0) {
                    const ratio = newTotalTokens / oldTotal;
                    const scaled: Record<string, number> = Object.entries(
                      currentRewards,
                    ).reduce(
                      (acc, [k, v]) => {
                        const num = Number(v);
                        return Number.isFinite(num)
                          ? { ...acc, [k]: num * ratio }
                          : { ...acc, [k]: v as any };
                      },
                      {} as Record<string, number>,
                    );

                    if ((tokenUsdValue || 0) <= 10) {
                      const rounded: Record<string, number> = {};
                      for (const [key, value] of Object.entries(scaled)) {
                        const numeric = Number(value) || 0;
                        const nearestTen = Math.round(numeric / 10) * 10;
                        rounded[key] = nearestTen;
                      }
                      const roundedSum = Object.values(rounded).reduce(
                        (sum, n) =>
                          sum + (Number.isFinite(n) ? (n as number) : 0),
                        0,
                      );
                      form.setValue('rewards', rounded, {
                        shouldValidate: false,
                      });
                      computedRewardAmountTokens = roundedSum;
                    } else {
                      form.setValue('rewards', scaled, {
                        shouldValidate: false,
                      });
                    }
                  }
                }

                const prevTokens = Number(rewardAmount) || 0;
                if (computedRewardAmountTokens > prevTokens) {
                  posthog.capture('boost_listing');
                }

                form.setValue('rewardAmount', computedRewardAmountTokens, {
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
                  setOpen(false);
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
              setOpen(false);
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
              if (
                compensationType === 'fixed' &&
                deadlineMoreThan72HoursLeft &&
                type !== 'hackathon' &&
                !isPrivate
              ) {
                setPanel('boost');
              } else {
                setOpen(false);
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
