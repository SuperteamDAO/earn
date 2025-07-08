import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface RatingClassNames {
  buttonClassName?: string;
  activeButtonClassName?: string;
  buttonWrapperClassName?: string;
  boundsClassName?: string;
}

interface RatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  scale: number;
  className?: string;
  classNames?: RatingClassNames;
  activeClassName?: string;
  lowerBoundLabel?: ReactNode;
  upperBoundLabel?: ReactNode;
}

export function Rating({
  value,
  onChange,
  scale,
  className,
  classNames = {},
  activeClassName,
  lowerBoundLabel = 'Difficult',
  upperBoundLabel = 'Easy',
}: RatingProps) {
  return (
    <div className={cn('mt-4', className)}>
      <div className={cn('flex gap-3', classNames.buttonWrapperClassName)}>
        {Array(scale)
          .fill(0)
          .map((_, i) => (
            <Button
              key={i}
              className={cn(
                'ring-primary-100 from-background to-background h-11 flex-1 rounded-lg bg-gradient-to-b ring-0 transition-all hover:bg-transparent hover:ring-2 focus-visible:ring-0 active:translate-y-0.5',
                classNames.buttonClassName,
                value === i + 1 && [
                  'text-accent-foreground from-primary-200 to-primary-100 shadow-primary -translate-y-0.5 bg-gradient-to-b hover:ring-0',
                  classNames.activeButtonClassName,
                  activeClassName,
                ],
              )}
              onClick={() => onChange(value === i + 1 ? null : i + 1)}
              variant="outline"
            >
              {i + 1}
            </Button>
          ))}
      </div>
      <div
        className={cn(
          'mt-2 flex justify-between text-xs text-slate-500',
          classNames.boundsClassName,
        )}
      >
        <p>{lowerBoundLabel}</p>
        <p>{upperBoundLabel}</p>
      </div>
    </div>
  );
}
