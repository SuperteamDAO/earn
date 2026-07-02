import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { chaptersQuery } from '@/features/chapters/queries/chapters';
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
  const { data: chapters = [] } = useQuery(chaptersQuery);

  return (
    <div
      className={cn('flex min-h-screen flex-col justify-between', className)}
    >
      {meta}
      <OutdatedBrowserWarning />
      {topBanner}
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <nav aria-label="Site links" className="sr-only">
        <Link href="/earn/bounties">Crypto Bounties</Link>
        <Link href="/earn/projects">Crypto Projects</Link>
        <Link href="/earn/grants">Crypto Grants</Link>
        <Link href="/earn/all">All Opportunities</Link>
        {chapters.map((chapter) => (
          <Link key={chapter.slug} href={`/earn/regions/${chapter.slug}`}>
            {chapter.name}
          </Link>
        ))}
      </nav>
      {!hideFooter && <Footer />}
      <ProUpgradeOverlay />
    </div>
  );
};
