import posthog from 'posthog-js';

import { cn } from '@/utils/cn';

interface CategoryPillProps {
  children: React.ReactNode;
  phEvent?: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  isPro?: boolean;
}

export function CategoryPill({
  children,
  phEvent,
  isActive,
  onClick,
  disabled = false,
  isPro = false,
}: CategoryPillProps) {
  return (
    <div
      className={cn(
        'ph-no-capture flex items-center gap-2 px-3.5 py-0.5 whitespace-nowrap select-none sm:py-0.5',
        'rounded-full border border-slate-200 text-[0.8rem] transition-colors duration-100 sm:text-sm',
        disabled
          ? 'cursor-not-allowed text-slate-400 opacity-50'
          : 'cursor-pointer',
        isActive && !disabled
          ? isPro
            ? 'border-zinc-800 bg-zinc-700 text-zinc-200 hover:bg-zinc-900 hover:text-zinc-200 hover:no-underline'
            : 'border-indigo-300 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 hover:text-indigo-600 hover:no-underline'
          : !disabled
            ? isPro
              ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 hover:no-underline'
              : 'text-slate-500 hover:bg-indigo-100 hover:text-slate-700 hover:no-underline'
            : 'text-slate-400',
      )}
      onClick={() => {
        if (disabled) return;

        if (phEvent) {
          posthog.capture(phEvent);
        }
        onClick?.();
      }}
    >
      {children}
    </div>
  );
}
