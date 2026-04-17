import type { NextPageContext } from 'next';

import { JsonLd } from '@/components/shared/JsonLd';
import { countries } from '@/constants/country';
import { type ChapterDisplay } from '@/interface/chapter';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import {
  generateBreadcrumbListSchema,
  generateRegionalOrganizationSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { ListingsSection } from '@/features/listings/components/ListingsSection';

interface AllRegionsPageProps {
  readonly slug: string;
  readonly st?: ChapterDisplay;
  readonly countryData?: {
    readonly name: string;
    readonly code: string;
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCountries(rawCountries: unknown): string[] {
  if (!Array.isArray(rawCountries)) return [];
  return rawCountries.filter(
    (country): country is string => typeof country === 'string',
  );
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
              canonical={`https://superteam.fun/earn/regions/${slug}/all/`}
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
              canonical={`https://superteam.fun/earn/regions/${slug}/all/`}
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

  const chapter = await prisma.chapter.findFirst({
    where: { slug: slugString, isHistorical: false },
    select: {
      name: true,
      icons: true,
      banner: true,
      region: true,
      displayValue: true,
      countries: true,
      code: true,
      hello: true,
      nationality: true,
      slug: true,
      link: true,
    },
  });

  const st = chapter
    ? ({
        name: chapter.name,
        icons: chapter.icons || '',
        banner: chapter.banner || '',
        region: chapter.region,
        displayValue: chapter.displayValue || chapter.region,
        country: parseCountries(chapter.countries),
        code: chapter.code || '',
        hello: chapter.hello || '',
        nationality: chapter.nationality || '',
        slug: chapter.slug,
        link: chapter.link || '',
      } satisfies ChapterDisplay)
    : null;

  if (st) {
    return {
      props: { slug, st },
    };
  }

  const country = countries.find((item) => slugify(item.name) === slugString);

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
