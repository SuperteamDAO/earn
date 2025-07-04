import posthog from 'posthog-js';

import { cn } from '@/utils/cn';

interface CategoryPillProps {
  children: React.ReactNode;
  phEvent?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function CategoryPill({
  children,
  phEvent,
  isActive,
  onClick,
}: CategoryPillProps) {
  return (
    <div
      className={cn(
        'ph-no-capture flex cursor-pointer items-center gap-2 px-3.5 py-0.5 whitespace-nowrap select-none sm:py-0.5',
        'rounded-full border border-slate-200 text-[0.8rem] sm:text-sm',
        'hover:bg-indigo-100 hover:text-slate-700 hover:no-underline',
        isActive
          ? 'border-indigo-300/70 bg-indigo-200 text-slate-700 hover:bg-indigo-200'
          : 'text-slate-500',
      )}
      onClick={() => {
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
