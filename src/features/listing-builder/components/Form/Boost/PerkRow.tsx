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
  previewVideoSrc,
}: {
  active?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  locked?: boolean;
  onClick?: () => void;
  requiredValue?: number;
  currentValue?: number;
  previewVideoSrc?: string;
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center rounded-lg border px-4 py-3 shadow-lg',
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

      {previewVideoSrc ? (
        <div className="pointer-events-none absolute top-1/2 right-full z-50 ml-3 w-80 -translate-y-1/2 overflow-hidden rounded-md border bg-white opacity-0 shadow-xl transition-opacity duration-100 group-hover:opacity-100">
          <video
            src={previewVideoSrc}
            className="h-54 w-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        </div>
      ) : null}
    </div>
  );
}
