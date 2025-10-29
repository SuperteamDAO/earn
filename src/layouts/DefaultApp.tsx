import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { Footer } from '@/features/navbar/components/Footer';
import { Header } from '@/features/navbar/components/Header';
import { OutdatedBrowserWarning } from '@/features/navbar/components/OutdatedBrowserWarning';

interface DefaultAppProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly hideFooter?: boolean;
}

export const DefaultApp = ({
  className,
  children,
  hideFooter,
}: DefaultAppProps) => {
  return (
    <div
      className={cn('flex min-h-screen flex-col justify-between', className)}
    >
      <OutdatedBrowserWarning />
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      {!hideFooter && <Footer />}
    </div>
  );
};
