import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function ListingBuilderFormLayout({
  className,
  children,
  ...props
}: LayoutProps) {
  return (
    <div
      className={cn(
        'bg-background flex min-h-screen flex-col justify-between',
        className,
      )}
      {...props}
    >
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
