import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Superteams } from '@/constants/Superteam';
import { Home } from '@/layouts/Home';
import { getURL } from '@/utils/validUrl';

import { RegionPop } from '@/features/conversion-popups/components/RegionPop';
import { GrantsSection } from '@/features/grants/components/GrantsSection';
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
  ogImage.searchParams.set('region', st.displayValue);
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

export default async function RegionsPage({ params }: PageProps) {
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
        <RegionPop st={st} />
        <ListingsSection type="region" region={st.region} />
        <GrantsSection type="region" region={st.region} />
      </div>
    </Home>
  );
}
