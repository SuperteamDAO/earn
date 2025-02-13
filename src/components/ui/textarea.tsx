import * as React from 'react';

import { cn } from '@/utils/cn';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'border-input focus-visible:ring-brand-purple flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
