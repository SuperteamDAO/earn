import { motion } from 'motion/react';
import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (prevHeight.current === 0 && bounds.height > 0) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
    prevHeight.current = bounds.height;
  }, [bounds.height]);

  const shouldAnimate = !disableOnHeightZero || bounds.height !== 0;

  return (
    <motion.div
      className={cn(className)}
      {...(shouldAnimate
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
