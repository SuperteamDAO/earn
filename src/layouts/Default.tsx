import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { Header } from '@/features/navbar/components/Header';

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
      {/* sr-only static links — always in SSR HTML so Googlebot can follow them regardless of footer ssr:false */}
      <nav aria-label="Site links" className="sr-only">
        <Link href="/earn/bounties">Crypto Bounties</Link>
        <Link href="/earn/projects">Crypto Projects</Link>
        <Link href="/earn/grants">Crypto Grants</Link>
        <Link href="/earn/all">All Opportunities</Link>
        <Link href="/earn/regions/india">Superteam India</Link>
        <Link href="/earn/regions/nigeria">Superteam Nigeria</Link>
        <Link href="/earn/regions/brazil">Superteam Brazil</Link>
        <Link href="/earn/regions/germany">Superteam Germany</Link>
        <Link href="/earn/regions/united-states">Superteam United States</Link>
        <Link href="/earn/regions/uk">Superteam UK</Link>
        <Link href="/earn/regions/ukraine">Superteam Ukraine</Link>
        <Link href="/earn/regions/singapore">Superteam Singapore</Link>
        <Link href="/earn/regions/malaysia">Superteam Malaysia</Link>
        <Link href="/earn/regions/indonesia">Superteam Indonesia</Link>
        <Link href="/earn/regions/uae">Superteam UAE</Link>
        <Link href="/earn/regions/spain">Superteam Spain</Link>
        <Link href="/earn/regions/netherlands">Superteam Netherlands</Link>
        <Link href="/earn/regions/canada">Superteam Canada</Link>
        <Link href="/earn/regions/japan">Superteam Japan</Link>
        <Link href="/earn/regions/poland">Superteam Poland</Link>
        <Link href="/earn/regions/korea">Superteam Korea</Link>
        <Link href="/earn/regions/ireland">Superteam Ireland</Link>
        <Link href="/earn/regions/kazakhstan">Superteam Kazakhstan</Link>
        <Link href="/earn/regions/georgia">Superteam Georgia</Link>
        <Link href="/earn/regions/balkan">Superteam Balkan</Link>
      </nav>
      {!hideFooter && <Footer />}
      <ProUpgradeOverlay />
    </div>
  );
};
