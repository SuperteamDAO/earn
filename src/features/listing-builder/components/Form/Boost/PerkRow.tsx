import { CheckIcon, LockIcon } from 'lucide-react';

import { cn } from '@/utils/cn';

export function PerkRow({
  active,
  icon,
  title,
  subtitle,
  locked,
  onClick,
  requiredValue,
  currentValue,
}: {
  active?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  locked?: boolean;
  onClick?: () => void;
  requiredValue?: number;
  currentValue?: number;
}) {
  return (
    <div
      className={cn(
        'flex items-center rounded-lg border px-4 py-3 shadow-lg',
        active ? 'border-brand-purple text-slate-500 shadow-indigo-600/10' : '',
        locked ? 'cursor-pointer text-slate-500/60' : '',
      )}
      onClick={onClick}
    >
      <div className="mt-1 mr-3 self-start">{icon}</div>
      <div className="mr-auto">
        <p
          className={cn(
            'flex items-center gap-2 text-base font-medium text-slate-600',
            locked ? 'text-slate-500/60' : '',
          )}
        >
          {title}
          {locked ? <LockIcon className="size-4 text-slate-500/60" /> : null}
        </p>
        {subtitle ? <p className="text-sm">{subtitle}</p> : null}
      </div>
      {locked ? (
        <span className="text-sm text-blue-600">
          +Add ${(requiredValue! - currentValue!).toLocaleString()}
        </span>
      ) : active ? (
        <div className="flex items-center justify-center rounded-full bg-violet-50 p-1.5">
          <CheckIcon className="text-brand-purple size-4" />
        </div>
      ) : null}
    </div>
  );
}
