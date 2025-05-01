import { cn } from '@/utils/cn';

import type { ListingTabTriggerProps } from '../types';

export const ListingTabTrigger = ({
  isActive,
  onClick,
  children,
}: ListingTabTriggerProps) => (
  <button
    onClick={onClick}
    className={cn(
      'group ring-offset-background relative inline-flex items-center justify-center rounded-md px-1 py-1 text-sm font-medium whitespace-nowrap transition-all sm:px-3',
      'hover:text-brand-purple',
      isActive && [
        'text-brand-purple',
        'after:bg-brand-purple/80 after:absolute after:bottom-[-12px] after:left-0 after:h-[2px] after:w-full',
      ],
      !isActive && 'text-slate-500',
    )}
  >
    {children}
  </button>
);
