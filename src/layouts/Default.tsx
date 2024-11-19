import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { Header } from '@/features/navbar';
import { cn } from '@/utils';

interface IDefaultProps {
  meta: ReactNode;
  children: ReactNode;
  className?: string;
  hideFooter?: boolean;
}

const Footer = dynamic(() =>
  import('@/features/navbar').then((mod) => mod.Footer),
);

export const Default = ({
  className,
  meta,
  children,
  hideFooter,
}: IDefaultProps) => {
  return (
    <div
      className={cn('flex min-h-screen flex-col justify-between', className)}
    >
      {meta}
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      {!hideFooter && <Footer />}
    </div>
  );
};
