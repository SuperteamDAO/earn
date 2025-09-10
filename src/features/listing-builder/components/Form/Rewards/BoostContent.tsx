import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { MailIcon, StarIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import FaXTwitter from '@/components/icons/FaXTwitter';
import { LocalImage } from '@/components/ui/local-image';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { tokenList } from '@/constants/tokenList';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { useListingForm } from '@/features/listing-builder/hooks';

import {
  BOOST_STEP_TO_AMOUNT_USD,
  DEFAULT_EMAIL_IMPRESSIONS,
  FEATURED_HOMEPAGE_IMPRESSIONS,
  isSkillsSelected,
  LIVE_LISTINGS_THREAD_IMPRESSIONS,
  STANDALONE_POST_IMPRESSIONS,
} from '../Boost/constants';
import { PerkRow } from '../Boost/PerkRow';
import {
  emailEstimateQuery,
  featuredAvailabilityQuery,
  tokenUsdValueQuery,
} from '../Boost/queries';
import {
  amountToStep,
  type BoostStep,
  calculateTotalImpressions,
  clampStepForAvailability,
  computeScaledRewardsForTargetUSD,
  getDollarAmountForStep,
} from '../Boost/utils';

export function BoostContent() {
  const form = useListingForm();

  const buildVideoUrl = (name: string) => {
    return `https://res.cloudinary.com/dgvnuwspr/video/upload/assets/boost/${name}.webm`;
  };

  const rewards = useWatch({
    control: form.control,
    name: 'rewards',
  }) as Record<string, number> | undefined;

  const maxBonusSpots = useWatch({
    control: form.control,
    name: 'maxBonusSpots',
  }) as number | undefined;

  const token = useWatch({
    control: form.control,
    name: 'token',
  });

  const rewardAmount = useWatch({
    control: form.control,
    name: 'rewardAmount',
  });

  const skills = useWatch({
    control: form.control,
    name: 'skills',
  });

  const region = useWatch({
    control: form.control,
    name: 'region',
  }) as string | undefined;

  const { data: tokenUsdValueData, isPending: isUsdPending } = useQuery(
    tokenUsdValueQuery(token as string | undefined),
  );
  const tokenUsdValue =
    typeof tokenUsdValueData === 'number' ? tokenUsdValueData : null;

  const { data: featuredData } = useQuery(featuredAvailabilityQuery());
  const isFeatureAvailable = featuredData?.isAvailable ?? true;

  const { data: emailEstimate } = useQuery(
    emailEstimateQuery(skills, region as string | undefined),
  );

  const safeRewardAmount = typeof rewardAmount === 'number' ? rewardAmount : 0;

  const applyBoostStep = (step: number) => {
    const safeStep = clampStepForAvailability(step, isFeatureAvailable);
    const targetUSD = getDollarAmountForStep(safeStep);

    const currentRewards = rewards || {};
    const { scaledRewards, newTotalTokens } = computeScaledRewardsForTargetUSD(
      currentRewards as Record<string, number>,
      (maxBonusSpots as number) || 0,
      tokenUsdValue,
      targetUSD,
    );

    if (scaledRewards) {
      form.setValue('rewards', scaledRewards, { shouldValidate: true });
    }

    form.setValue('rewardAmount', newTotalTokens, { shouldValidate: true });
    form.saveDraft();
  };

  const handlePerkClick = (unlockValue: number) => {
    applyBoostStep(unlockValue);
  };

  const emailImpressions =
    isSkillsSelected(skills) && typeof emailEstimate === 'number'
      ? emailEstimate
      : DEFAULT_EMAIL_IMPRESSIONS;

  const getTotalImpressions = (sliderValue: BoostStep): number => {
    return calculateTotalImpressions(
      sliderValue,
      emailImpressions,
      isFeatureAvailable,
    );
  };

  const estimatedUsdValue = tokenUsdValue
    ? safeRewardAmount * tokenUsdValue
    : null;

  const sliderStepUnclamped = amountToStep(
    estimatedUsdValue || 0,
    isFeatureAvailable,
  );
  const sliderStep = clampStepForAvailability(
    sliderStepUnclamped,
    isFeatureAvailable,
  );

  const totalImpressions = getTotalImpressions(sliderStep);

  const referenceDate = dayjs('2025-08-28');
  const nextThursday = referenceDate.add(
    (4 - referenceDate.day() + 7) % 7,
    'day',
  );
  const mod2Thursday = nextThursday.add(14, 'day');

  const day = mod2Thursday.date();
  const month = mod2Thursday.format('MMM');

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  const formattedNextPostDate = `${getOrdinalSuffix(day)} ${month}`;

  useEffect(() => {
    const videoNames = ['x-thread', 'x-standalone', 'email', 'featured'];
    const sources = videoNames.map(buildVideoUrl);
    const created: HTMLVideoElement[] = [];
    const preload = () => {
      sources.forEach((src) => {
        const v = document.createElement('video');
        v.src = src;
        v.preload = 'auto';
        v.muted = true;
        v.playsInline = true as any;
        v.load();
        created.push(v);
      });
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload);
    } else {
      setTimeout(preload, 0);
    }
    return () => {
      created.forEach((v) => v.remove());
    };
  }, []);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="mx-20 flex items-center justify-around">
        <div className="text-center">
          <p className="flex items-center gap-2 text-4xl font-semibold text-slate-900">
            <LocalImage
              src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
              alt={token!}
              className="size-8"
            />
            {formatNumberWithSuffix(safeRewardAmount, 1, true)}
          </p>
          <p className="text-sm text-slate-500">
            {token} <span className="text-slate-500/30">•</span> ~$
            {isUsdPending
              ? '...'
              : estimatedUsdValue !== null
                ? formatNumberWithSuffix(estimatedUsdValue, 1, true)
                : 'N/A'}
          </p>
        </div>

        <Separator orientation="vertical" />
        <div className="text-center">
          <p className="text-4xl font-semibold text-slate-900">
            {formatNumberWithSuffix(totalImpressions, 1, true)}
          </p>
          <p className="text-sm text-slate-500">Estimated Reach</p>
        </div>
      </div>
      <div className="space-y-2.5">
        <p className="text-sm font-medium text-slate-500">Prize Pool</p>
        <Slider
          value={[sliderStep]}
          onValueChange={(value) => applyBoostStep(value[0] ?? 0)}
          min={0}
          max={isFeatureAvailable ? 75 : 50}
          step={25}
          className="h-3 w-full"
        />
        <div className="flex justify-between text-base font-medium text-slate-500">
          <span>${BOOST_STEP_TO_AMOUNT_USD[0].toLocaleString()}</span>
          <span>${BOOST_STEP_TO_AMOUNT_USD[25].toLocaleString()}</span>
          <span>${BOOST_STEP_TO_AMOUNT_USD[50].toLocaleString()}</span>
          {isFeatureAvailable ? (
            <span>${BOOST_STEP_TO_AMOUNT_USD[75].toLocaleString()}</span>
          ) : null}
        </div>
      </div>

      <div className="-mx-6">
        <Separator className="my-2" />
      </div>

      <div className="space-y-4">
        <p className="text-base font-medium text-slate-600">
          What&apos;s included
        </p>

        <PerkRow
          active={true}
          icon={<FaXTwitter className="size-5" />}
          title="X Fortnightly Thread"
          subtitle={`~${formatNumberWithSuffix(LIVE_LISTINGS_THREAD_IMPRESSIONS, 1, false, true)} Impressions | next post on ${formattedNextPostDate}`}
          previewVideoSrc={buildVideoUrl('x-thread')}
        />

        <PerkRow
          active={sliderStep >= 25}
          icon={<FaXTwitter className="size-5" />}
          title="X Standalone Post"
          subtitle={`~${formatNumberWithSuffix(STANDALONE_POST_IMPRESSIONS, 1, false, true)} Impressions`}
          locked={sliderStep < 25}
          onClick={sliderStep < 25 ? () => handlePerkClick(25) : undefined}
          requiredValue={BOOST_STEP_TO_AMOUNT_USD[25]}
          currentValue={estimatedUsdValue || 0}
          previewVideoSrc={buildVideoUrl('x-standalone')}
        />

        <PerkRow
          active={sliderStep >= 50}
          icon={<MailIcon className="size-5" />}
          title="Email Broadcast"
          subtitle={`${formatNumberWithSuffix(emailImpressions, 1, false, true)} Emails`}
          locked={sliderStep < 50}
          onClick={sliderStep < 50 ? () => handlePerkClick(50) : undefined}
          requiredValue={BOOST_STEP_TO_AMOUNT_USD[50]}
          currentValue={estimatedUsdValue || 0}
          previewVideoSrc={buildVideoUrl('email')}
        />

        {isFeatureAvailable ? (
          <PerkRow
            active={sliderStep >= 75}
            icon={<StarIcon className="size-5" />}
            title="Featured on Homepage"
            subtitle={`${formatNumberWithSuffix(FEATURED_HOMEPAGE_IMPRESSIONS, 1, false, true)} Impressions`}
            locked={sliderStep < 75}
            onClick={sliderStep < 75 ? () => handlePerkClick(75) : undefined}
            requiredValue={BOOST_STEP_TO_AMOUNT_USD[75]}
            currentValue={estimatedUsdValue || 0}
            previewVideoSrc={buildVideoUrl('featured')}
          />
        ) : null}
      </div>
    </div>
  );
}
