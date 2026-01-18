import type { NextPageContext } from 'next';

import { JsonLd } from '@/components/shared/JsonLd';
import { type Superteam, Superteams } from '@/constants/Superteam';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import {
  generateBreadcrumbListSchema,
  generateRegionalOrganizationSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { ListingsSection } from '@/features/listings/components/ListingsSection';
import { findCountryBySlug } from '@/features/listings/utils/region';

interface AllRegionsPageProps {
  readonly slug: string;
  readonly st?: Superteam;
  readonly countryData?: {
    readonly name: string;
    readonly code: string;
  };
}

export default function AllRegionsPage({
  slug,
  st,
  countryData,
}: AllRegionsPageProps) {
  if (st) {
    const displayName = st.displayValue;

    const ogImage = new URL(`${getURL()}api/dynamic-og/region/`);
    ogImage.searchParams.set('region', st.region);
    ogImage.searchParams.set('code', st.code!);

    const organizationSchema = generateRegionalOrganizationSchema(st);
    const breadcrumbSchema = generateBreadcrumbListSchema([
      { name: 'Home', url: '/' },
      { name: displayName || st.region },
    ]);

    return (
      <Home
        type="region"
        st={st}
        meta={
          <>
            <Meta
              title={`Welcome to Superteam Earn ${displayName} | Discover Bounties and Grants`}
              description={`Welcome to Superteam ${displayName}'s page — Discover bounties and grants and become a part of the global crypto community`}
              canonical={`https://earn.superteam.fun/earn/regions/${slug}/all/`}
              og={ogImage.toString()}
            />
            <JsonLd data={[organizationSchema, breadcrumbSchema]} />
          </>
        }
      >
        <div className="w-full">
          <ListingsSection type="region-all" region={st.region} />
        </div>
      </Home>
    );
  }

  if (countryData) {
    const countryName = countryData.name;
    const countryCode = countryData.code.toUpperCase();

    const ogImage = new URL(`${getURL()}api/dynamic-og/region/`);
    ogImage.searchParams.set('region', countryName);
    ogImage.searchParams.set('code', countryCode);

    const organizationSchema = generateRegionalOrganizationSchema({
      displayValue: countryName,
      region: countryName,
      slug,
      code: countryCode,
    });

    const breadcrumbSchema = generateBreadcrumbListSchema([
      { name: 'Home', url: '/' },
      { name: countryName },
    ]);

    return (
      <Home
        type="region"
        countryData={countryData}
        meta={
          <>
            <Meta
              title={`Welcome to Superteam Earn ${countryName} | Discover Bounties and Grants`}
              description={`Welcome to Superteam ${countryName}'s page — Discover bounties and grants and become a part of the global crypto community`}
              canonical={`https://earn.superteam.fun/earn/regions/${slug}/all/`}
              og={ogImage.toString()}
            />
            <JsonLd data={[organizationSchema, breadcrumbSchema]} />
          </>
        }
      >
        <div className="w-full">
          <ListingsSection type="region-all" region={countryName} />
        </div>
      </Home>
    );
  }

  return null;
}

export async function getServerSideProps(context: NextPageContext) {
  const { slug } = context.query;
  const slugString = (slug as string)?.toLowerCase() || '';

  const st = Superteams.find((team) => team.slug?.toLowerCase() === slugString);

  if (st) {
    return {
      props: { slug, st },
    };
  }

  const country = findCountryBySlug(slugString);

  if (country) {
    return {
      props: {
        slug,
        countryData: {
          name: country.name,
          code: country.code,
        },
      },
    };
  }

  return { notFound: true };
}
