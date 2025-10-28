import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Superteams } from '@/constants/Superteam';
import { Home } from '@/layouts/Home';
import { getURL } from '@/utils/validUrl';

import { ListingCardSkeleton } from '@/features/listings/components/ListingCard';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const st = Superteams.find(
    (team) => team.slug?.toLowerCase() === slug.toLowerCase(),
  );

  if (!st) {
    return {};
  }

  const ogImage = new URL(`${getURL()}api/dynamic-og/region/`);
  ogImage.searchParams.set('region', st.region);
  ogImage.searchParams.set('code', st.code!);

  const displayName = st.displayValue;

  return {
    title: `Welcome to Superteam Earn ${displayName} | Discover Bounties and Grants`,
    description: `Welcome to Superteam ${displayName}'s page — Discover bounties and grants and become a part of the global crypto community`,
    openGraph: {
      images: [ogImage.toString()],
    },
  };
}

function ListingsSectionFallback() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default async function AllRegionsPage({ params }: PageProps) {
  const { slug } = await params;

  const st = Superteams.find(
    (team) => team.slug?.toLowerCase() === slug.toLowerCase(),
  );

  if (!st) {
    notFound();
  }

  return (
    <Home type="region" st={st}>
      <div className="w-full">
        <Suspense fallback={<ListingsSectionFallback />}>
          <ListingsSection type="region-all" region={st.region} />
        </Suspense>
      </div>
    </Home>
  );
}
