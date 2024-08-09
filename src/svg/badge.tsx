import React from 'react';

import { type Rewards } from '@/features/listings';
import { nthLabelGenerator } from '@/utils/rank';

export const Badge = ({
  position,
}: {
  position: keyof Rewards | undefined;
}) => {
  position = Number(position);
  const displayText = nthLabelGenerator(position ?? 0);
  return (
    <svg
      width="33"
      height="59"
      viewBox="0 0 33 59"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 0H33V59H13C5.8203 59 0 53.1797 0 46V0Z"
        fill={position === 1 ? '#FFE4BB' : '#CBD5E1'}
      />
      <path
        d="M10.8396 25.1667L12.3291 18.7271L7.33331 14.3958L13.9333 13.8229L16.5 7.75L19.0666 13.8229L25.6666 14.3958L20.6708 18.7271L22.1604 25.1667L16.5 21.7521L10.8396 25.1667Z"
        fill={position === 1 ? '#FFB545' : '#334254'}
      />
      <text
        x="50%"
        y="70%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={position === 1 ? '#98733B' : '#64758B'}
        fontSize="11"
        fontWeight={600}
      >
        {displayText}
      </text>
    </svg>
  );
};
