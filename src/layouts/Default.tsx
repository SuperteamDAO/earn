import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

const ProUpgradeOverlay = dynamic(
  () =>
    import('@/features/pro/components/ProUpgradeOverlay').then(
      (mod) => mod.ProUpgradeOverlay,
    ),
  { ssr: false },
);

interface IDefaultProps {
  readonly meta: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly hideFooter?: boolean;
  readonly topBanner?: ReactNode;
}

const Footer = dynamic(
  () => import('@/features/navbar/components/Footer').then((mod) => mod.Footer),
  { ssr: false },
);

const Header = dynamic(() =>
  import('@/features/navbar/components/Header').then((mod) => mod.Header),
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
  topBanner,
}: IDefaultProps) => {
  return (
    <div
      className={cn('flex min-h-screen flex-col justify-between', className)}
    >
      {meta}
      <OutdatedBrowserWarning />
      {topBanner}
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      {!hideFooter && <Footer />}
      <ProUpgradeOverlay />
    </div>
  );
};
