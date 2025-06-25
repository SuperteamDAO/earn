import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { Header } from '@/features/navbar/components/Header';

interface IDefaultProps {
  readonly meta: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly hideFooter?: boolean;
}

const Footer = dynamic(
  () => import('@/features/navbar/components/Footer').then((mod) => mod.Footer),
  { ssr: false },
);

const OutdatedBrowserWarning = dynamic(
  () =>
    import('@/features/navbar/components/OutdatedBrowserWarning').then(
      (mod) => mod.OutdatedBrowserWarning,
    ),
  { ssr: false },
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
      <OutdatedBrowserWarning />
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      {!hideFooter && <Footer />}
    </div>
  );
};
