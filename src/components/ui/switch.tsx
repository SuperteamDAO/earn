import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/utils/cn';

function Switch({
  className,
  thumbClassName,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  thumbClassName?: string;
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-background pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
          thumbClassName,
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
