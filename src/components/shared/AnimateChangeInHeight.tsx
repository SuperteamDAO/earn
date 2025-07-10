import { motion } from 'motion/react';
import React from 'react';
import useMeasure from 'react-use-measure';
import { type ClassNameValue } from 'tailwind-merge';

import { cn } from '@/utils/cn';

interface AnimateChangeInHeightProps {
  children: React.ReactNode;
  className?: ClassNameValue;
  duration?: number;
}

export const AnimateChangeInHeight = ({
  children,
  className,
  duration = 0.2,
}: AnimateChangeInHeightProps) => {
  const [elementRef, bounds] = useMeasure();

  return (
    <motion.div
      className={cn(className)}
      animate={{
        height: bounds.height,
        transition: {
          type: 'spring',
          duration,
          bounce: 0,
        },
      }}
    >
      <div ref={elementRef}>{children}</div>
    </motion.div>
  );
};
