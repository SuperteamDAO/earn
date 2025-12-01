import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { HelpCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import { ProListingsAnnouncement } from '@/features/announcements/components/ProListingsAnnouncement';
import { scaleRewardsForTargetUsd } from '@/features/listing-builder/utils/rewards';

import { isEditingAtom } from '../../../atoms';
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

interface ProOnlyProps {
  onShowNudgesChange?: (show: boolean) => void;
  onSwitchRef?: (ref: HTMLDivElement | null) => void;
}

export function ProOnly({ onShowNudgesChange, onSwitchRef }: ProOnlyProps) {
  const form = useListingForm();
  const isEditing = useAtomValue(isEditingAtom);
  const [showCallout, setShowCallout] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showProAnnouncement, setShowProAnnouncement] = useState(false);
  const switchRef = useRef<HTMLDivElement | null>(null);

  const isPrivate = useWatch({
    control: form.control,
    name: 'isPrivate',
  });

  const publishedAt = useWatch({
    control: form.control,
    name: 'publishedAt',
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
    console.log('[ProOnly] handleProToggle called', {
      checked,
      isUnderMinimum,
      showCallout,
      isShaking,
      currentIsPro: isPro,
      timestamp: new Date().toISOString(),
    });

    if (checked && isUnderMinimum) {
      console.log('[ProOnly] Entering shake animation flow');
      setIsShaking(true);
      form.setValue('isPro', true, { shouldValidate: false });
      console.log('[ProOnly] Set isShaking=true, isPro=true');

      setTimeout(() => {
        console.log('[ProOnly] Timeout callback executing', {
          isShaking,
          showCallout,
          isPro,
        });
        setIsShaking(false);
        setShowCallout(true);
        form.setValue('isPro', false, { shouldValidate: false });
        console.log(
          '[ProOnly] Timeout complete: isShaking=false, showCallout=true, isPro=false',
        );
      }, 500);
      return;
    }

    console.log('[ProOnly] Normal toggle (not under minimum)');
    form.setValue('isPro', checked, { shouldValidate: false });
    form.saveDraft();
  };

  const showNudges = !showCallout && !isPro;

  useEffect(() => {
    onShowNudgesChange?.(showNudges);
  }, [showNudges, onShowNudgesChange]);

  useEffect(() => {
    onSwitchRef?.(switchRef.current ?? null);
  }, [onSwitchRef]);

  // Debug useEffect to track all state changes
  useEffect(() => {
    console.log('[ProOnly] State change detected', {
      isPro,
      isUnderMinimum,
      isShaking,
      showCallout,
      estimatedUsdValue,
      minProUsd,
      difference,
      hasDevelopmentSkills,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack,
    });
  }, [
    isPro,
    isUnderMinimum,
    isShaking,
    showCallout,
    estimatedUsdValue,
    minProUsd,
    difference,
    hasDevelopmentSkills,
  ]);

  // Debug useEffect specifically for the problematic useEffect at line 137-143
  useEffect(() => {
    const shouldTrigger = isPro && isUnderMinimum && !isShaking;
    console.log('[ProOnly] Auto-reset useEffect check', {
      isPro,
      isUnderMinimum,
      isShaking,
      shouldTrigger,
      showCallout,
      timestamp: new Date().toISOString(),
    });

    if (shouldTrigger) {
      console.log(
        '[ProOnly] Auto-reset useEffect TRIGGERED - this might be interfering!',
      );
      console.log('[ProOnly] About to set isPro=false and showCallout=true');
    }
  }, [isPro, isUnderMinimum, isShaking, showCallout]);

  if (!form) return null;

  if (!!publishedAt || isEditing) return null;

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
                <div className="flex items-center gap-2">
                  <FormLabel className="">Pro Only (Top 1% of Earn)</FormLabel>
                  <button
                    type="button"
                    onClick={() => setShowProAnnouncement(true)}
                    className="text-slate-400 transition-colors hover:text-slate-600"
                    aria-label="Learn more about Pro Only"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                <FormDescription>
                  Users with &gt;$1k Earnings + Superteam Members eligible
                </FormDescription>
              </div>
              <FormControl className="flex items-center">
                <div className="relative" ref={switchRef}>
                  <Tooltip
                    zIndex="z-[300]"
                    content="Reach High Quality Talent"
                    open={showNudges}
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
                  {showNudges && <ProArrow />}
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
      <ProListingsAnnouncement
        forceOpen={showProAnnouncement}
        onOpenChange={setShowProAnnouncement}
      />
    </div>
  );
}
