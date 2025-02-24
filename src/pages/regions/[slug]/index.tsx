import { useQuery } from '@tanstack/react-query';
import type { NextPageContext } from 'next';
import React from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import { PROJECT_NAME } from '@/constants/project';
import { type Team, TeamRegions } from '@/constants/Team';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { getURL } from '@/utils/validUrl';

import { RegionPop } from '@/features/conversion-popups/components/RegionPop';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { ListingSection } from '@/features/listings/components/ListingSection';
import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { listingsQuery } from '@/features/listings/queries/listings';
import { regionalListingsQuery } from '@/features/listings/queries/region-listings';

const RegionsPage = ({
  slug,
  displayName,
  st,
}: {
  slug: string;
  displayName: string;
  st: Team;
}) => {
  const { data: listings, isLoading: isListingsLoading } = useQuery(
    regionalListingsQuery({ region: slug, take: 10 }),
  );

  const { data: sponsorships, isLoading } = useQuery(
    listingsQuery({ type: 'sponsorship', take: 10 }),
  );

  const ogImage = new URL(`${getURL()}api/dynamic-og/region/`);
  ogImage.searchParams.set('region', st.displayValue);
  ogImage.searchParams.set('code', st.code!);

  return (
    <Home type="region" st={st}>
      <Meta
        title={`Welcome to ${PROJECT_NAME} ${displayName} | Discover Bounties and Sponsorships  `}
        description={`Welcome to ${PROJECT_NAME} ${displayName}'s page — Discover bounties and sponsorships and become a part of the global crypto community`}
        canonical={`${getURL()}/regions/${slug}/`}
        og={ogImage.toString()}
      />
      <div className="w-full">
        <RegionPop st={st} />
        <ListingTabs
          bounties={listings?.bounties}
          isListingsLoading={isListingsLoading}
          showEmoji
          title="Freelance Gigs"
          showViewAll
          viewAllLink={`/regions/${slug}/all`}
          take={10}
        />

        <ListingSection
          type="bounties"
          title="Sponsorships"
          sub="Sponsor projects and get exposure"
          showEmoji
          showViewAll
        >
          {isLoading && (
            <div className="flex min-h-52 flex-col items-center justify-center">
              <Loading />
            </div>
          )}
          {!sponsorships?.length && (
            <div className="mt-8 flex items-center justify-center">
              <EmptySection
                title="No sponsorships available!"
                message="Subscribe to notifications to get notified about new sponsorships."
              />
            </div>
          )}
          {sponsorships &&
            sponsorships
              ?.filter((sponsorship) => sponsorship.status === 'OPEN')
              .map((sponsorship) => {
                return (
                  <ListingCard key={sponsorship.id} bounty={sponsorship} />
                );
              })}
        </ListingSection>
      </div>
    </Home>
  );
};

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

export default RegionsPage;
