import type { NextPageContext } from 'next';

import { type Superteam, Superteams } from '@/constants/Superteam';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { getURL } from '@/utils/validUrl';

import { RegionPop } from '@/features/conversion-popups/components/RegionPop';
import { GrantsSection } from '@/features/grants/components/GrantsSection';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

const RegionsPage = ({ slug, st }: { slug: string; st: Superteam }) => {
  const displayName = st?.displayValue;

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
        <ListingsSection type="region" region={st.region} />

        <GrantsSection type="region" region={st.region} />
      </div>
    </Home>
  );
};

export async function getServerSideProps(context: NextPageContext) {
  const { slug } = context.query;

  const st = Superteams.find(
    (team) => team.slug?.toLowerCase() === (slug as string).toLowerCase(),
  );

  if (!st) {
    return { notFound: true };
  }

  return {
    props: { slug, st },
  };
}

export default RegionsPage;
