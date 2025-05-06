import { useQuery } from '@tanstack/react-query';
import type { NextPageContext } from 'next';
import React from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import { type Superteam, Superteams } from '@/constants/Superteam';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { getURL } from '@/utils/validUrl';

import { RegionPop } from '@/features/conversion-popups/components/RegionPop';
import { GrantsCard } from '@/features/grants/components/GrantsCard';
import { ListingSection } from '@/features/listings/components/ListingSection';
import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { regionalListingsQuery } from '@/features/listings/queries/region-listings';

const RegionsPage = ({
  slug,
  displayName,
  st,
}: {
  slug: string;
  displayName: string;
  st: Superteam;
}) => {
  const { data: listings, isLoading: isListingsLoading } = useQuery(
    regionalListingsQuery({ region: slug, take: 10 }),
  );

  const ogImage = new URL(`${getURL()}api/dynamic-og/region/`);
  ogImage.searchParams.set('region', st.displayValue);
  ogImage.searchParams.set('code', st.code!);

  return (
    <Home type="region" st={st}>
      <Meta
        title={`Welcome to Superteam Earn ${displayName} | Discover Bounties and Grants`}
        description={`Welcome to Superteam ${displayName}'s page — Discover bounties and grants and become a part of the global crypto community`}
        canonical={`https://earn.superteam.fun/regions/${slug}/`}
        og={ogImage.toString()}
      />
      <div className="w-full">
        <RegionPop st={st} />
        <ListingTabs type="region" region={slug} />

        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          showEmoji
        >
          {isListingsLoading && (
            <div className="flex min-h-52 flex-col items-center justify-center">
              <Loading />
            </div>
          )}
          {!isListingsLoading && !listings?.grants?.length && (
            <div className="mt-8 flex items-center justify-center">
              <EmptySection title="No grants available!" />
            </div>
          )}
          {!isListingsLoading &&
            listings?.grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
            })}
        </ListingSection>
      </div>
    </Home>
  );
};

export async function getServerSideProps(context: NextPageContext) {
  const { slug } = context.query;

  const st = Superteams.find(
    (team) => team.region?.toLowerCase() === (slug as string).toLowerCase(),
  );
  const displayName = st?.displayValue;

  if (!st) {
    return {
      notFound: true,
    };
  }

  return {
    props: { slug, displayName, st },
  };
}

export default RegionsPage;
