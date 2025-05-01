import { usePostHog } from 'posthog-js/react';

import { cn } from '@/utils/cn';

interface CategoryPillProps {
  children: React.ReactNode;
  phEvent: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function CategoryPill({
  children,
  phEvent,
  isActive,
  onClick,
}: CategoryPillProps) {
  const posthog = usePostHog();

  return (
    <div
      className={cn(
        'ph-no-capture flex cursor-pointer items-center gap-2 px-3 py-0 select-none sm:py-0.5',
        'rounded-full border border-slate-200 text-sm',
        'hover:bg-indigo-100 hover:text-slate-600 hover:no-underline',
        isActive
          ? 'bg-indigo-200 text-slate-900 hover:bg-indigo-200'
          : 'text-slate-500',
      )}
      onClick={() => {
        posthog.capture(phEvent);
        onClick?.();
      }}
    >
      {children}
    </div>
  );
}
