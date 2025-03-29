import * as React from 'react';

import { cn } from '@/utils/cn';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input file:text-foreground focus-visible:ring-brand-purple flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-[0.8rem] text-slate-700 shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
