import { motion } from 'motion/react';
import React, { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

interface AnimateChangeInHeightProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export const AnimateChangeInHeight = ({
  children,
  className,
  duration = 0.1,
}: AnimateChangeInHeightProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  useLayoutEffect(() => {
    if (containerRef.current) {
      const { height } = containerRef.current.getBoundingClientRect();
      setHeight(height);
    }
  }, [children]);

  return (
    <motion.div
      className={cn(className, 'overflow-hidden')}
      style={{ height }}
      animate={{ height }}
      transition={{ duration }}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
};
