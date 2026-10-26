import type { ReactNode } from 'react';

import { TopLoader } from '@/components/ui/toploader';
import { cn } from '@/utils/cn';

import { Footer } from '@/features/navbar/components/Footer';
import { Header } from '@/features/navbar/components/Header';
import { OutdatedBrowserWarning } from '@/features/navbar/components/OutdatedBrowserWarning';
import { ShellRedirects } from '@/features/navbar/components/ShellRedirects';

interface IDefaultProps {
  // Ignored: pages export `metadata` now.
  readonly meta?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly hideFooter?: boolean;
  readonly topBanner?: ReactNode;
  // Under the header, inside its sticky part (the homepage's sponsor
  // stage snackbar).
  readonly headerSnackbar?: ReactNode;
}

// Earn's page shell: the outdated-browser warning, the header (desktop
// navbar, mobile navbar and drawer, bottom bar), the page and the footer.
// The viewer comes from the root layout (useViewer), the rest of the
// shell's data from src/app/earn/layout.tsx (useShellData). Nothing here
// is server-only, so pages not yet moved off the Pages Router can still
// render it while the migration lasts.
export const Default = ({
  className,
  children,
  hideFooter,
  topBanner,
  headerSnackbar,
}: IDefaultProps) => {
  return (
    <div
      className={cn('flex min-h-screen flex-col justify-between', className)}
    >
      <OutdatedBrowserWarning />
      {topBanner}
      <Header snackbar={headerSnackbar} />
      <div className="flex flex-1 flex-col">{children}</div>
      {!hideFooter && <Footer />}
      <TopLoader />
      <ShellRedirects />
    </div>
  );
};
