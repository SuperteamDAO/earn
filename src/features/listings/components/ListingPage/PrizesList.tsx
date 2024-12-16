import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { nthLabelGenerator } from '@/utils/rank';

import { type Rewards } from '../../types';

function calculateRewards(
  iterableRewards: [string, number][],
  totalReward: number,
) {
  const firstFive = iterableRewards.slice(0, 5);
  const sumFirstFive = firstFive.reduce((sum, [_, value]) => sum + value, 0);
  const remainingReward = totalReward - sumFirstFive;

  return {
    visibleRewards: firstFive,
    remainingReward: Math.max(remainingReward, 0),
  };
}

export function PrizesList({
  rewards,
  token,
  maxBonusSpots,
  totalReward,
  widthPrize,
}: {
  rewards: Rewards;
  token: string;
  maxBonusSpots: number;
  totalReward: number;
  widthPrize: string;
}) {
  const iterableRewards: [string, number][] = Object.entries(rewards);
  const [visibleRewards, setVisibleRewards] =
    useState<[string, number][]>(iterableRewards);
  const [seeAll, setSeeAll] = useState(true);
  const [boxHeight, setBoxHeight] = useState('20px');

  useEffect(() => {
    if (seeAll) {
      setVisibleRewards(iterableRewards);
    } else if (iterableRewards.length > 6) {
      const rippedRewards = calculateRewards(iterableRewards, totalReward);
      setVisibleRewards([
        ...rippedRewards.visibleRewards,
        [BONUS_REWARD_POSITION + '', rippedRewards.remainingReward],
      ]);
    }
  }, [seeAll]);

  useEffect(() => {
    setSeeAll(iterableRewards.length <= 6);
  }, []);

  useEffect(() => {
    const l = visibleRewards.length;
    if (l === 1) setBoxHeight('20px');
    else if (l === 2) setBoxHeight(`${visibleRewards.length * 31}px`);
    else if (l === 3) setBoxHeight(`${visibleRewards.length * 35}px`);
    else if (l === 4) setBoxHeight(`${visibleRewards.length * 37}px`);
    else setBoxHeight(`${visibleRewards.length * 40}px`);
  }, [visibleRewards]);

  return (
    <div className={cn('mt-3 flex w-full flex-col gap-3', `h-[${boxHeight}]`)}>
      {visibleRewards.map((step, index) => (
        <div
          key={index}
          className="relative flex gap-3"
          style={{ overflowY: 'visible' }}
        >
          <div className="relative top-2 mx-2.5 h-3 w-3 rounded-full bg-slate-200">
            <div className="h-full w-full" />
          </div>

          <div className="flex flex-shrink-0 gap-2 text-lg md:text-xl">
            <div
              className={cn(
                'ml-auto flex gap-1 font-semibold',
                `w-[${widthPrize}]`,
              )}
            >
              <p className="ml-auto">
                {!seeAll && visibleRewards.length - 1 === index && '+'}{' '}
                {formatNumberWithSuffix(step[1], 1, true)}
              </p>
              <p className="font-semibold text-slate-400">{token}</p>
            </div>
            <LabelOrAction
              setSeeAll={setSeeAll}
              step={step}
              maxBonusSpots={maxBonusSpots}
              seeAll={seeAll}
              index={index}
              needsCollapse={
                iterableRewards.length > 6 &&
                visibleRewards.length - 1 === index
              }
            />
          </div>

          {index !== visibleRewards.length - 1 && (
            <div
              className="absolute left-4 w-px"
              style={{
                height: '120%',
                top: '1.2rem',
                maxHeight: 'none',
                borderLeftWidth: '1px',
                borderColor: 'rgb(226 232 240)',
                borderStyle:
                  visibleRewards[index + 1]?.[0] ===
                    BONUS_REWARD_POSITION + '' &&
                  visibleRewards.length - 2 === index
                    ? 'dashed'
                    : 'solid',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
interface LabelOrActionProps {
  step: [string, number];
  maxBonusSpots: number;
  seeAll: boolean;
  index: number;
  setSeeAll: (val: boolean) => void;
  needsCollapse: boolean;
}

function LabelOrAction({
  step,
  maxBonusSpots,
  seeAll,
  index,
  setSeeAll,
  needsCollapse,
}: LabelOrActionProps) {
  if (Number(step[0]) === BONUS_REWARD_POSITION) {
    if (!seeAll) {
      return (
        <button
          className="font-inherit flex items-center gap-1 bg-transparent hover:opacity-80"
          onClick={() => setSeeAll(true)}
        >
          View More
          <ChevronDown className="mt-0.5 h-4 w-4 rounded-full border" />
        </button>
      );
    } else
      return (
        <p className="text-md text-slate-500">
          {nthLabelGenerator(index + 1)}
          {index + 1 !== index + maxBonusSpots && (
            <> - {nthLabelGenerator(index + maxBonusSpots)}</>
          )}
          {needsCollapse && (
            <button
              className="font-inherit flex items-center gap-1 bg-transparent hover:opacity-80"
              onClick={() => setSeeAll(false)}
            >
              <ChevronUp className="relative top-0.5 h-4 w-4 rounded-full border" />
            </button>
          )}
        </p>
      );
  } else {
    return (
      <p className="mb-1 mt-auto text-sm font-medium text-slate-500">
        {nthLabelGenerator(Number(step[0]))}
        {needsCollapse && (
          <button
            className="font-inherit flex items-center gap-1 bg-transparent hover:opacity-80"
            onClick={() => setSeeAll(false)}
          >
            <ChevronUp className="relative top-0.5 h-4 w-4 rounded-full border" />
          </button>
        )}
      </p>
    );
  }
}
