'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/utils/cn';

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'bg-primary h-full w-full flex-1 transition-all',
          indicatorClassName,
        )}
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: props.color,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

function CircularProgress({
  value,
  className,
  color = '#818CF8',
}: React.ComponentProps<'div'> & {
  value: number;
  color?: string;
}) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      data-slot="circular-progress"
      className={cn('relative h-5 w-5', className)}
    >
      <div
        data-slot="circular-progress-track"
        className="absolute h-full w-full rounded-full bg-gray-200"
      />
      <div
        data-slot="circular-progress-indicator"
        className="absolute h-full w-full rounded-full transition-all duration-300"
        style={{
          background: `conic-gradient(${color} ${normalizedValue}%, transparent ${normalizedValue}%)`,
          transform: 'rotate(-108deg)',
        }}
      />
      <div
        data-slot="circular-progress-center"
        className="absolute top-[3px] right-[3px] bottom-[3px] left-[3px] rounded-full bg-white"
      />
    </div>
  );
}

export { CircularProgress, Progress };
