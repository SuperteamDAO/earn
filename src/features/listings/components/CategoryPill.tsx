import posthog from 'posthog-js';

import { cn } from '@/utils/cn';

interface CategoryPillProps {
  children: React.ReactNode;
  phEvent?: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function CategoryPill({
  children,
  phEvent,
  isActive,
  onClick,
  disabled = false,
}: CategoryPillProps) {
  return (
    <button
      type="button"
      className={cn(
        'ph-no-capture flex items-center gap-2 px-3.5 py-0.5 whitespace-nowrap select-none sm:py-0.5',
        'rounded-full border border-slate-200 text-[0.8rem] transition-colors duration-100 sm:text-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/60 focus-visible:ring-offset-2',
        disabled
          ? 'cursor-not-allowed text-slate-400 opacity-50'
          : 'cursor-pointer',
        isActive && !disabled
          ? 'border-indigo-300 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 hover:text-indigo-600 hover:no-underline'
          : !disabled
            ? 'text-slate-500 hover:bg-indigo-100 hover:text-slate-700 hover:no-underline'
            : 'text-slate-400',
      )}
      aria-pressed={isActive}
      aria-disabled={disabled || undefined}
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
