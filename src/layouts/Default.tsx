import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

// TEMPORARY STUB while the home area rebuilds the shell (header, footer)
// for the App Router. Same export and props as Earn's; `meta` is ignored
// (pages export `metadata` now).
interface IDefaultProps {
  readonly meta?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly hideFooter?: boolean;
  readonly topBanner?: ReactNode;
}

export const Default = ({ className, children, topBanner }: IDefaultProps) => {
  return (
    <div
      className={cn('flex min-h-screen flex-col justify-between', className)}
    >
      {topBanner}
      <header className="flex h-14 items-center border-b border-slate-200 px-4">
        <a href="/earn/" className="font-semibold text-slate-800">
          Superteam Earn
        </a>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
};
