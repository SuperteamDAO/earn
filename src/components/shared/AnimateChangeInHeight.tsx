import { type ClassNameValue } from 'cn';
import { m } from 'motion/react';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import useMeasure from 'react-use-measure';

import { cn } from '@/utils/cn';

interface AnimateChangeInHeightProps {
  children: React.ReactNode;
  className?: ClassNameValue;
  duration?: number;
  disableOnHeightZero?: boolean;
}

export const AnimateChangeInHeight = ({
  children,
  className,
  duration = 0.2,
  disableOnHeightZero = false,
}: AnimateChangeInHeightProps) => {
  const [elementRef, bounds] = useMeasure();
  const prevHeight = useRef(bounds.height);
  const [hasHadNonZeroHeight, setHasHadNonZeroHeight] = useState(
    () => bounds.height !== 0,
  );

  const shouldAnimate = useMemo(
    () => !disableOnHeightZero || bounds.height !== 0,
    [disableOnHeightZero, bounds.height],
  );

  const shouldAnimateThisRender = useMemo(
    () => shouldAnimate && hasHadNonZeroHeight,
    [shouldAnimate, hasHadNonZeroHeight],
  );

  // shouldAnimate is always true once the height is non-zero, so this is the
  // 0 -> non-zero transition: nudge listeners that measure on resize.
  const isVisible = bounds.height > 0;
  useLayoutEffect(() => {
    if (!isVisible) return;
    const timers = [0, 50, 100, 250].map((delay) =>
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [isVisible]);

  useLayoutEffect(() => {
    const prev = prevHeight.current;
    prevHeight.current = bounds.height;

    const shouldSetTrue = bounds.height !== 0 && !hasHadNonZeroHeight;
    const shouldSetFalse =
      prev === 0 && bounds.height === 0 && hasHadNonZeroHeight;
    const timer = setTimeout(() => {
      if (shouldSetTrue) setHasHadNonZeroHeight(true);
      else if (shouldSetFalse) setHasHadNonZeroHeight(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [bounds.height, hasHadNonZeroHeight]);

  return (
    <m.div
      className={cn(className)}
      initial={false}
      {...(shouldAnimateThisRender
        ? {
            animate: {
              height: bounds.height,
              transition: {
                type: 'spring',
                duration,
                bounce: 0,
              },
            },
          }
        : {})}
    >
      <div ref={elementRef}>{children}</div>
    </m.div>
  );
};
