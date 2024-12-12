import type { TooltipContentProps } from '@radix-ui/react-tooltip';
import * as React from 'react';

import { Toggle } from '@/components/ui/toggle';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface ToolbarButtonProps
  extends React.ComponentPropsWithoutRef<typeof Toggle> {
  isActive?: boolean;
  tooltip?: string;
  tooltipOptions?: TooltipContentProps;
}

export const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps
>(
  (
    { isActive, children, tooltip, className, tooltipOptions, ...props },
    ref,
  ) => {
    const toggleButton = (
      <Toggle
        size="sm"
        ref={ref}
        className={cn('size-8 p-0', { 'bg-accent': isActive }, className)}
        {...props}
      >
        {children}
      </Toggle>
    );

    if (!tooltip) {
      return toggleButton;
    }

    return (
      <Tooltip
        content={
          <div className="flex flex-col items-center text-center">
            {tooltip}
          </div>
        }
        contentProps={tooltipOptions}
      >
        {toggleButton}
      </Tooltip>
    );
  },
);

ToolbarButton.displayName = 'ToolbarButton';
