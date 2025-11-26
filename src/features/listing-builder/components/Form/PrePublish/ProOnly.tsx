import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';

import { scaleRewardsForTargetUsd } from '@/features/listing-builder/utils/rewards';

import { useListingForm } from '../../../hooks';
import { tokenUsdValueQuery } from '../Boost/queries';
import { computeEstimatedUsdValue } from '../Boost/utils';

const DEV_PARENTS = ['Frontend', 'Backend', 'Blockchain', 'Mobile'] as const;

const ProArrow = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    className="absolute right-2 -bottom-7 fill-slate-800 stroke-slate-800 stroke-1"
    style={{ filter: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))' }}
  >
    <path d="M6 0L12 6H0L6 0Z" />
  </svg>
);

export function ProOnly() {
  const form = useListingForm();
  const [showCallout, setShowCallout] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const isPrivate = useWatch({
    control: form.control,
    name: 'isPrivate',
  });

  const token = useWatch({
    control: form.control,
    name: 'token',
  });

  const rewardAmount = useWatch({
    control: form.control,
    name: 'rewardAmount',
  });

  const rewards = useWatch({
    control: form.control,
    name: 'rewards',
  });

  const maxBonusSpots = useWatch({
    control: form.control,
    name: 'maxBonusSpots',
  });

  const type = useWatch({
    control: form.control,
    name: 'type',
  });

  const skills = useWatch({
    control: form.control,
    name: 'skills',
  });

  const isPro = useWatch({
    control: form.control,
    name: 'isPro',
  });

  const { data: tokenUsdValueData } = useQuery(
    tokenUsdValueQuery(token as string | undefined),
  );
  const tokenUsdValue =
    typeof tokenUsdValueData === 'number' ? tokenUsdValueData : null;

  const safeRewardAmount = typeof rewardAmount === 'number' ? rewardAmount : 0;

  const estimatedUsdValue = useMemo(
    () => computeEstimatedUsdValue(safeRewardAmount, tokenUsdValue),
    [safeRewardAmount, tokenUsdValue],
  );

  const hasDevelopmentSkills = useMemo(() => {
    if (!skills || !Array.isArray(skills)) return false;
    const mainSkills = skills.map((s) => s.skills);
    const devParentsSet = new Set<string>(DEV_PARENTS as unknown as string[]);
    return mainSkills.some((skill) => devParentsSet.has(skill));
  }, [skills]);

  const minProUsd = hasDevelopmentSkills ? 5000 : 3000;
  const isUnderMinimum =
    estimatedUsdValue !== null && estimatedUsdValue < minProUsd;
  const difference = isUnderMinimum
    ? Math.ceil(minProUsd - estimatedUsdValue)
    : 0;

  useEffect(() => {
    if (isPrivate) {
      form.setValue('isPro', false);
      form.saveDraft();
      setShowCallout(false);
    }
  }, [isPrivate, form]);

  useEffect(() => {
    if (!isUnderMinimum && showCallout) {
      setShowCallout(false);
    }
  }, [isUnderMinimum, showCallout]);

  useEffect(() => {
    if (isPro && isUnderMinimum && !isShaking) {
      form.setValue('isPro', false, { shouldValidate: false });
      form.saveDraft();
      setShowCallout(true);
    }
  }, [isPro, isUnderMinimum, form, isShaking]);

  const handleUpdateRewards = () => {
    if (!tokenUsdValue || estimatedUsdValue === null) return;

    const targetUSD = minProUsd;
    const { rewardAmountTokens, rewardsToPersist } = scaleRewardsForTargetUsd({
      rewards,
      maxBonusSpots,
      targetUsd: targetUSD,
      tokenUsdValue,
      shouldScalePodium: type !== 'project',
      shouldRoundToNearestTen: tokenUsdValue <= 10,
    });

    if (rewardsToPersist) {
      form.setValue('rewards', rewardsToPersist, {
        shouldValidate: false,
      });
    }

    form.setValue('rewardAmount', rewardAmountTokens, {
      shouldValidate: false,
    });

    form.setValue('isPro', true, {
      shouldValidate: false,
    });

    form.saveDraft();

    setShowCallout(false);

    const event = new CustomEvent('openRewardsWithProAdjustment', {
      detail: {
        increasedBy: difference,
        minRequired: minProUsd,
      },
    });
    window.dispatchEvent(event);
  };

  const handleProToggle = (checked: boolean) => {
    if (checked && isUnderMinimum) {
      setIsShaking(true);
      form.setValue('isPro', true, { shouldValidate: false });

      setTimeout(() => {
        setIsShaking(false);
        setShowCallout(true);
        form.setValue('isPro', false, { shouldValidate: false });
      }, 500);
      return;
    }

    form.setValue('isPro', checked, { shouldValidate: false });
    form.saveDraft();
  };

  const shouldShowTooltip = !showCallout && !isPro;

  if (!form) return null;

  if (isPrivate) return null;

  return (
    <div
      className={`animate-in fade-in-0 slide-in-from-top-2 relative duration-200 ${
        isShaking ? 'animate-shake' : ''
      }`}
      key="pro-only"
    >
      <FormField
        name="isPro"
        control={form.control}
        render={({ field }) => {
          return (
            <FormItem className="flex flex-row items-center justify-between">
              <div className="">
                <FormLabel className="">Pro Only (Top 1% of Earn)</FormLabel>
                <FormDescription>
                  Users with &gt;$1k Earnings + Superteam Members eligible
                </FormDescription>
              </div>
              <FormControl className="flex items-center">
                <div className="relative">
                  <Tooltip
                    zIndex="z-[500]"
                    content="Reach High Quality Talent"
                    open={shouldShowTooltip}
                    onOpenChange={() => {}}
                    contentProps={{
                      side: 'bottom',
                      align: 'end',
                      className:
                        'bg-slate-800 text-white border-slate-800 relative mt-3',
                    }}
                  >
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={handleProToggle}
                      disabled={showCallout && isUnderMinimum}
                    />
                  </Tooltip>
                  {shouldShowTooltip && <ProArrow />}
                </div>
              </FormControl>
            </FormItem>
          );
        }}
      />
      {showCallout && isUnderMinimum && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 zoom-in-95 mt-2 flex flex-col rounded-lg bg-orange-50 p-4 duration-300">
          <p className="text-sm text-yellow-700">
            This PRO listing requires a minimum of $
            {hasDevelopmentSkills ? '5k' : '3k'} in rewards. Please add $
            {difference.toLocaleString()} to your listing to be eligible.
          </p>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="my-0 px-0 py-0 font-bold text-yellow-700 underline"
              onClick={handleUpdateRewards}
            >
              UPDATE REWARDS
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
