import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/utils/cn';

interface TooltipProps extends TooltipPrimitive.TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  contentProps?: React.ComponentPropsWithoutRef<
    typeof TooltipPrimitive.Content
  >;
  disabled?: boolean;
  triggerClassName?: string;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-w-sm overflow-hidden rounded-md border bg-gray-50 px-3 py-1.5 text-xs text-slate-700',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const Tooltip = React.forwardRef<HTMLButtonElement, TooltipProps>(
  ({
    children,
    content,
    contentProps,
    triggerClassName,
    disabled,
    ...props
  }) => {
    const [open, setOpen] = React.useState(false);

    if (disabled) {
      return <>{children}</>;
    }

    return (
      <TooltipPrimitive.Provider delayDuration={0}>
        <TooltipPrimitive.Root open={open} {...props}>
          <TooltipPrimitive.Trigger asChild>
            <button
              type="button"
              className={cn('cursor-pointer', triggerClassName)}
              onClick={() => setOpen(!open)}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              onTouchStart={() => setOpen(open)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setOpen(!open);
                }
              }}
            >
              {children}
            </button>
          </TooltipPrimitive.Trigger>
          <TooltipContent {...contentProps}>{content}</TooltipContent>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    );
  },
);
Tooltip.displayName = 'Tooltip';

export { Tooltip };
