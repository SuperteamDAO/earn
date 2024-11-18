import { keyframes } from '@emotion/react';
import React from 'react';

interface PulseIconProps {
  bg: string;
  text: string;
  w: number;
  h: number;
  isPulsing?: boolean;
}

export const PulseIcon = ({
  bg,
  text,
  w,
  h,
  isPulsing = false,
}: PulseIconProps) => {
  const pulseKeyframes = React.useMemo(
    () => keyframes`
      0% {
        transform: scale(0.75);
        box-shadow: 0 0 0 0 ${bg};
      }
      
      100% {
        transform: scale(1);
        box-shadow: 0 0 0 8px ${bg}00;
      }
    `,
    [bg],
  );

  const pulseAnimation = `${pulseKeyframes} 1250ms infinite`;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: w - 1,
          height: h - 1,
          backgroundColor: bg,
          opacity: 0.8,
          animation: isPulsing ? pulseAnimation : undefined,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-1"
        style={{ backgroundColor: text }}
      />
    </div>
  );
};
