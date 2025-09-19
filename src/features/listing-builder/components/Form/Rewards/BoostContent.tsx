import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { MailIcon, StarIcon } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  FEATURED_HOMEPAGE_IMPRESSIONS,
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
  type BoostStep,
  buildAnchorMap,
  computeEstimatedUsdValue,
  getDollarAmountForStep,
  getTotalImpressionsForUsd,
  resolveEmailImpressions,
} from '../Boost/utils';

export function BoostContent({
  boostStep,
  setBoostStep,
}: {
  boostStep: number;
  setBoostStep: (s: number) => void;
}) {
  const form = useListingForm();
  const [hasInteracted, setHasInteracted] = useState(false);
  const SWITCH_FRACTION = 0.1;

  const buildVideoUrl = (name: string) => {
    return `https://res.cloudinary.com/dgvnuwspr/video/upload/assets/boost/${name}.webm`;
  };

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

  const handlePerkClick = (unlockValue: number) => {
    const requiredUsd = BOOST_STEP_TO_AMOUNT_USD[unlockValue as BoostStep] ?? 0;
    const map = buildAnchorMap(estimatedUsdValue, isFeatureAvailable);
    const target = map.anchors.find((a) => a.usd === requiredUsd);
    const stepToSet = target?.step ?? (unlockValue as BoostStep);
    setBoostStep(stepToSet);
    setHasInteracted(true);
  };

  const emailImpressions = resolveEmailImpressions(skills, emailEstimate);

  const estimatedUsdValue = computeEstimatedUsdValue(
    safeRewardAmount,
    tokenUsdValue,
  );

  const anchorMap = useMemo(
    () => buildAnchorMap(estimatedUsdValue, isFeatureAvailable),
    [estimatedUsdValue, isFeatureAvailable],
  );

  const sliderMin = 0;
  const sliderMax = anchorMap.maxStep;

  const defaultStep = anchorMap.defaultStep;

  const anchorSteps = useMemo(
    () =>
      anchorMap.anchors
        .map((a) => a.step)
        .slice()
        .sort((a, b) => a - b),
    [anchorMap.anchors],
  );

  const [snappedIndex, setSnappedIndex] = useState(() => {
    const idx = anchorSteps.findIndex((s) => s === defaultStep);
    return idx >= 0 ? idx : 0;
  });

  const prevRawRef = useRef<number | null>(null);
  const justSwitchedRef = useRef(false);

  useEffect(() => {
    const idx = anchorSteps.findIndex((s) => s === defaultStep);
    setSnappedIndex(idx >= 0 ? idx : 0);
    setBoostStep(defaultStep);
    setHasInteracted(false);
    prevRawRef.current = null;
    justSwitchedRef.current = false;
  }, [defaultStep, anchorSteps]);

  const activeStep = hasInteracted ? (boostStep as number) : defaultStep;
  const activeAnchor = anchorMap.anchors.find((a) => a.step === activeStep);
  const activeUsd = activeAnchor
    ? activeAnchor.usd
    : activeStep === 100
      ? (anchorMap.anchors[anchorMap.anchors.length - 1]?.usd ?? null)
      : getDollarAmountForStep(
          (Math.max(0, Math.min(75, activeStep)) || 0) as BoostStep,
        );
  const totalImpressions = getTotalImpressionsForUsd(
    typeof activeUsd === 'number' ? activeUsd : null,
    emailImpressions,
    isFeatureAvailable,
  );

  const initialUSD = useMemo(() => {
    return estimatedUsdValue !== null ? Math.round(estimatedUsdValue) : null;
  }, [estimatedUsdValue]);

  const previewUSD = useMemo(() => {
    if (!hasInteracted && initialUSD !== null) return initialUSD;
    const step = hasInteracted ? boostStep : defaultStep;
    const a = anchorMap.anchors.find((x) => x.step === step);
    if (a) return a.usd;
    if (step === 100)
      return anchorMap.anchors[anchorMap.anchors.length - 1]?.usd ?? null;
    const clamped = Math.max(0, Math.min(step, 75)) as BoostStep;
    return getDollarAmountForStep(clamped);
  }, [hasInteracted, initialUSD, anchorMap.anchors, boostStep, defaultStep]);

  const previewTokens = useMemo(() => {
    if (!hasInteracted) {
      return safeRewardAmount;
    }
    if (tokenUsdValue && previewUSD !== null) return previewUSD / tokenUsdValue;
    return safeRewardAmount;
  }, [previewUSD, tokenUsdValue, safeRewardAmount, hasInteracted]);

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
        v.muted = true as any;
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
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`tokens-${Math.round(previewTokens * 1000)}`}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {formatNumberWithSuffix(previewTokens, 1, true)}
              </motion.span>
            </AnimatePresence>
          </p>
          <p className="text-sm text-slate-500">
            {token} <span className="text-slate-500/30">•</span> ~$
            <AnimatePresence mode="popLayout">
              {isUsdPending ? (
                <motion.span key="pending">...</motion.span>
              ) : previewUSD !== null ? (
                <motion.span
                  key={`usd-${Math.round(previewUSD)}`}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {formatNumberWithSuffix(previewUSD, 1, true)}
                </motion.span>
              ) : (
                <motion.span key="na">N/A</motion.span>
              )}
            </AnimatePresence>
          </p>
        </div>

        <Separator orientation="vertical" />
        <div className="text-center">
          <p className="text-4xl font-semibold text-slate-900">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`imp-${Math.round(totalImpressions)}`}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {new Intl.NumberFormat('en-US').format(totalImpressions)}
              </motion.span>
            </AnimatePresence>
          </p>
          <p className="text-sm text-slate-500">Estimated Reach</p>
        </div>
      </div>
      <div className="space-y-2.5">
        <p className="text-sm font-medium text-slate-500">Prize Pool</p>
        <Slider
          value={[anchorSteps[snappedIndex] ?? defaultStep]}
          onValueChange={(value) => {
            const raw = Math.max(
              sliderMin,
              Math.min(sliderMax, value[0] ?? sliderMin),
            );
            const prevRaw = prevRawRef.current;
            const dir = prevRaw === null ? 0 : raw - prevRaw;
            prevRawRef.current = raw;

            if (justSwitchedRef.current) {
              setHasInteracted(true);
              return;
            }
            const currentIdx = snappedIndex;
            const a = anchorSteps[currentIdx]!;
            const b = anchorSteps[currentIdx + 1];
            const p = anchorSteps[currentIdx - 1];
            let newIdx = currentIdx;

            if (dir > 0) {
              const forwardThreshold =
                b !== undefined ? a + (b - a) * SWITCH_FRACTION : Infinity;
              if (b !== undefined && raw >= forwardThreshold) {
                newIdx = currentIdx + 1;
              }
            } else if (dir < 0) {
              const backwardThreshold =
                p !== undefined ? a - (a - p) * SWITCH_FRACTION : -Infinity;
              if (p !== undefined && raw <= backwardThreshold) {
                newIdx = currentIdx - 1;
              }
            }

            if (newIdx !== currentIdx) {
              setSnappedIndex(newIdx);
              setBoostStep(anchorSteps[newIdx] as number);
              justSwitchedRef.current = true;
              requestAnimationFrame(() => {
                justSwitchedRef.current = false;
              });
            }
            setHasInteracted(true);
          }}
          min={sliderMin}
          max={sliderMax}
          step={1}
          className="h-3 w-full hover:cursor-grab"
        />
        <div className="flex justify-between text-base font-medium text-slate-500">
          {anchorMap.anchors.map((a) => (
            <button
              key={`anchor-${a.step}-${a.usd}`}
              type="button"
              onClick={() => {
                const idx = anchorSteps.findIndex(
                  (s) => s === (a.step as number),
                );
                if (idx >= 0) setSnappedIndex(idx);
                setBoostStep(a.step as number);
                setHasInteracted(true);
              }}
              className="cursor-pointer text-slate-500 transition-colors select-none hover:text-slate-600 focus:outline-none"
            >
              ${a.usd.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-6">
        <Separator className="my-2" />
      </div>

      <LayoutGroup>
        <div className="space-y-4">
          <p className="text-base font-medium text-slate-600">
            What&apos;s included
          </p>

          <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <PerkRow
              active={(previewUSD || 0) >= BOOST_STEP_TO_AMOUNT_USD[0]}
              icon={<FaXTwitter className="size-5" />}
              title="X Fortnightly Thread"
              subtitle={`~${formatNumberWithSuffix(LIVE_LISTINGS_THREAD_IMPRESSIONS, 1, false, true)} Impressions | next post on ${formattedNextPostDate}`}
              locked={(previewUSD || 0) < BOOST_STEP_TO_AMOUNT_USD[0]}
              onClick={
                (previewUSD || 0) < BOOST_STEP_TO_AMOUNT_USD[0]
                  ? () => handlePerkClick(0)
                  : undefined
              }
              requiredValue={BOOST_STEP_TO_AMOUNT_USD[0]}
              currentValue={previewUSD || 0}
              previewVideoSrc={buildVideoUrl('x-thread')}
            />
          </motion.div>

          <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 32,
              delay: 0.03,
            }}
          >
            <PerkRow
              active={(previewUSD || 0) >= BOOST_STEP_TO_AMOUNT_USD[25]}
              icon={<FaXTwitter className="size-5" />}
              title="X Standalone Post"
              subtitle={`~${formatNumberWithSuffix(STANDALONE_POST_IMPRESSIONS, 1, false, true)} Impressions`}
              locked={(previewUSD || 0) < BOOST_STEP_TO_AMOUNT_USD[25]}
              onClick={
                (previewUSD || 0) < BOOST_STEP_TO_AMOUNT_USD[25]
                  ? () => handlePerkClick(25)
                  : undefined
              }
              requiredValue={BOOST_STEP_TO_AMOUNT_USD[25]}
              currentValue={previewUSD || 0}
              previewVideoSrc={buildVideoUrl('x-standalone')}
            />
          </motion.div>

          <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 32,
              delay: 0.06,
            }}
          >
            <PerkRow
              active={(previewUSD || 0) >= BOOST_STEP_TO_AMOUNT_USD[50]}
              icon={<MailIcon className="size-5" />}
              title="Email Broadcast"
              subtitle={`${formatNumberWithSuffix(emailImpressions, 1, false, true)} Emails`}
              locked={(previewUSD || 0) < BOOST_STEP_TO_AMOUNT_USD[50]}
              onClick={
                (previewUSD || 0) < BOOST_STEP_TO_AMOUNT_USD[50]
                  ? () => handlePerkClick(50)
                  : undefined
              }
              requiredValue={BOOST_STEP_TO_AMOUNT_USD[50]}
              currentValue={previewUSD || 0}
              previewVideoSrc={buildVideoUrl('email')}
            />
          </motion.div>

          <AnimatePresence>
            {isFeatureAvailable ? (
              <motion.div
                key="featured"
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 34,
                  delay: 0.09,
                }}
                className="pb-12"
              >
                <PerkRow
                  active={(previewUSD || 0) >= BOOST_STEP_TO_AMOUNT_USD[75]}
                  icon={<StarIcon className="size-5" />}
                  title="Featured on Homepage"
                  subtitle={`${formatNumberWithSuffix(FEATURED_HOMEPAGE_IMPRESSIONS, 1, false, true)} Impressions`}
                  locked={(previewUSD || 0) < BOOST_STEP_TO_AMOUNT_USD[75]}
                  onClick={
                    (previewUSD || 0) < BOOST_STEP_TO_AMOUNT_USD[75]
                      ? () => handlePerkClick(75)
                      : undefined
                  }
                  requiredValue={BOOST_STEP_TO_AMOUNT_USD[75]}
                  currentValue={previewUSD || 0}
                  previewVideoSrc={buildVideoUrl('featured')}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  );
}
