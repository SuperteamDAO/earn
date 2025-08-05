import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';
import * as React from 'react';
import { type ClassNameValue } from 'tailwind-merge';

import { cn } from '@/utils/cn';

interface CheckboxProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  classNames?: {
    indicatorClassName?: ClassNameValue;
  };
}
function Checkbox({ className, classNames, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring h-4 w-4 shrink-0 rounded-sm border shadow-sm focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          'flex items-center justify-center text-current',
          classNames?.indicatorClassName,
        )}
      >
        <CheckIcon className="size-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
