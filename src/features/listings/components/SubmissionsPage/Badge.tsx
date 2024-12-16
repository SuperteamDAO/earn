import { Star } from 'lucide-react';
import React from 'react';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder';
import { type Rewards } from '@/features/listings/types';
import { nthLabelGenerator } from '@/utils/rank';

export const Badge = ({
  position,
}: {
  position: keyof Rewards | undefined;
}) => {
  if (position === BONUS_REWARD_POSITION) return <></>;
  position = Number(position);
  return (
    <div
      className={`inline-flex h-[1.2rem] w-fit items-center gap-1 rounded-full px-2 text-sm ${
        position === 1
          ? 'bg-orange-50 text-orange-600'
          : 'bg-slate-50 text-slate-600'
      }`}
    >
      <Star className="h-3 w-3" />
      {position !== BONUS_REWARD_POSITION && (
        <p>{nthLabelGenerator(position ?? 0)}</p>
      )}
    </div>
  );
};
