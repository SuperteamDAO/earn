import { useQuery } from '@tanstack/react-query';
import type { NextPageContext } from 'next';

import { PROJECT_NAME } from '@/constants/project';
import { type Team, TeamRegions } from '@/constants/Team';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { getURL } from '@/utils/validUrl';

import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { regionalListingsQuery } from '@/features/listings/queries/region-listings';

export default function AllRegionListingsPage({
  slug,
  displayName,
  st,
}: {
  slug: string;
  displayName: string;
  st: Team;
}) {
  const { data: listings, isLoading: isListingsLoading } = useQuery(
    regionalListingsQuery({ region: slug }),
  );

  const ogImage = new URL(`${getURL()}api/dynamic-og/region/`);
  ogImage.searchParams.set('region', st.region);
  ogImage.searchParams.set('code', st.code!);

  return (
    <Home type="region" st={st}>
      <Meta
        title={`Welcome to ${PROJECT_NAME} ${displayName} | Discover Bounties and Grants`}
        description={`Welcome to ${PROJECT_NAME} ${displayName}'s page — Discover bounties and grants and become a part of the global crypto community`}
        canonical={`${getURL()}/regions/${slug}/`}
        og={ogImage.toString()}
      />
      <div className="w-full">
        <ListingTabs
          bounties={listings?.bounties}
          isListingsLoading={isListingsLoading}
          showEmoji
          title="Freelance Gigs"
          viewAllLink="/all"
        />
      </div>
    </Home>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  const { slug } = context.query;

  const st = TeamRegions.find((team) => team.region.toLowerCase() === slug);
  const displayName = st?.displayValue;

  const validRegion = TeamRegions.some(
    (team) => team.region.toLowerCase() === (slug as string).toLowerCase(),
  );

  if (!validRegion) {
    return {
      notFound: true,
    };
  }

  return {
    props: { slug, displayName, st },
  };
}
