import { motion } from 'motion/react';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import useMeasure from 'react-use-measure';
import { type ClassNameValue } from 'tailwind-merge';

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

  useLayoutEffect(() => {
    if (shouldAnimate && prevHeight.current === 0 && bounds.height > 0) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 250);
    }
    const prev = prevHeight.current;
    prevHeight.current = bounds.height;

    if (bounds.height !== 0 && !hasHadNonZeroHeight) {
      setTimeout(() => {
        setHasHadNonZeroHeight(true);
      }, 0);
    } else if (prev === 0 && bounds.height === 0 && hasHadNonZeroHeight) {
      setTimeout(() => {
        setHasHadNonZeroHeight(false);
      }, 0);
    }
  }, [bounds.height, shouldAnimate, hasHadNonZeroHeight]);

  return (
    <motion.div
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
    </motion.div>
  );
};
