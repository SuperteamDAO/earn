import posthog from 'posthog-js';

import { cn } from '@/utils/cn';

interface CategoryPillProps {
  children: React.ReactNode;
  phEvent?: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  role?: string;
  'aria-selected'?: boolean;
  tabIndex?: number;
}

export function CategoryPill({
  children,
  phEvent,
  isActive,
  onClick,
  disabled = false,
  role,
  'aria-selected': ariaSelected,
  tabIndex,
}: CategoryPillProps) {
  return (
    <button
      type="button"
      className={cn(
        'ph-no-capture flex items-center gap-2 px-3.5 py-0.5 whitespace-nowrap select-none sm:py-0.5',
        'rounded-full border border-slate-200 text-[0.8rem] transition-colors duration-100 sm:text-sm',
        'focus-visible:ring-brand-purple/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        disabled
          ? 'cursor-not-allowed text-slate-400 opacity-50'
          : 'cursor-pointer',
        isActive && !disabled
          ? 'border-indigo-300 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 hover:text-indigo-600 hover:no-underline'
          : !disabled
            ? 'text-slate-500 hover:bg-indigo-100 hover:text-slate-700 hover:no-underline'
            : 'text-slate-400',
      )}
      role={role}
      aria-selected={role === 'tab' ? ariaSelected : undefined}
      aria-pressed={role !== 'tab' ? isActive : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex}
      onClick={() => {
        if (disabled) return;

        if (phEvent) {
          posthog.capture(phEvent);
        }
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}
