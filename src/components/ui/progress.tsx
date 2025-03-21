import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/utils/cn';

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, indicatorClassName, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
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
));
Progress.displayName = ProgressPrimitive.Root.displayName;

const CircularProgress = ({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) => {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('relative h-5 w-5', className)}>
      <div className="absolute h-full w-full rounded-full bg-gray-200" />
      <div
        className="absolute h-full w-full rounded-full transition-all duration-300"
        style={{
          background: `conic-gradient(#818CF8 ${normalizedValue}%, transparent ${normalizedValue}%)`,
          transform: 'rotate(-108deg)',
        }}
      />
      <div className="absolute top-[3px] right-[3px] bottom-[3px] left-[3px] rounded-full bg-white" />
    </div>
  );
};

export { CircularProgress, Progress };
