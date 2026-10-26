import * as Effect from 'effect/Effect';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { countries } from '@/constants/country';
import type { ChapterDisplay } from '@/interface/chapter';
import { Home } from '@/layouts/Home';
import { JsonLdScripts } from '@/layouts/JsonLdScripts';
import { pageMetadata } from '@/lib/metadata';
import * as HomeChapters from '@/server/home-chapters';
import { runtime } from '@/server/runtime';
import {
  generateBreadcrumbListSchema,
  generateRegionalOrganizationSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { GrantsSection } from '@/features/grants/components/GrantsSection';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

type Props = PageProps<'/earn/regions/[slug]'>;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// A chapter's page, else a country's (as Earn's getServerSideProps found
// them), else nothing.
const regionOf = cache(async (rawSlug: string) => {
  const slug = rawSlug.toLowerCase();
  const chapters = await runtime.runPromise(
    HomeChapters.HomeChapters.use((all) => all.all).pipe(
      Effect.orElseSucceed(() => []),
    ),
  );
  const chapter = chapters.find((item) => item.slug === slug);
  if (chapter) {
    const st: ChapterDisplay = {
      name: chapter.name,
      icons: chapter.icons || '',
      banner: chapter.banner || '',
      region: chapter.region,
      displayValue: chapter.displayValue,
      country: [...chapter.country],
      code: chapter.code,
      hello: chapter.hello || '',
      nationality: chapter.nationality || '',
      slug: chapter.slug,
      link: chapter.link || '',
    };
    return { kind: 'chapter', slug, st } as const;
  }
  const country = countries.find((item) => slugify(item.name) === slug);
  if (country) {
    return {
      kind: 'country',
      slug,
      countryData: { name: country.name, code: country.code },
    } as const;
  }
  return null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const region = await regionOf((await params).slug);
  if (!region) return {};
  const name =
    region.kind === 'chapter'
      ? region.st.displayValue
      : region.countryData.name;
  const code =
    region.kind === 'chapter'
      ? region.st.code
      : region.countryData.code.toUpperCase();
  const ogImage = new URL(`${getURL()}api/dynamic-og/region/`);
  ogImage.searchParams.set('region', name);
  ogImage.searchParams.set('code', code);
  return pageMetadata({
    title: `Welcome to Superteam Earn ${name} | Discover Bounties and Grants`,
    description: `Welcome to Superteam Earn ${name}'s page — Discover bounties and grants and become a part of the global crypto community`,
    canonical: `https://superteam.fun/earn/regions/${region.slug}/`,
    og: ogImage.toString(),
  });
}

export default async function RegionsPage({ params, searchParams }: Props) {
  const region = await regionOf((await params).slug);
  if (!region) notFound();
  const query = await searchParams;

  if (region.kind === 'chapter') {
    const { st } = region;
    const displayName = st.displayValue;
    const organizationSchema = generateRegionalOrganizationSchema(st);
    const breadcrumbSchema = generateBreadcrumbListSchema([
      { name: 'Home', url: '/' },
      { name: displayName || st.region },
    ]);

    return (
      <Home type="region" st={st}>
        <JsonLdScripts data={[organizationSchema, breadcrumbSchema]} />
        <div className="w-full">
          <ListingsSection
            type="region"
            region={st.region}
            searchParams={query}
          />

          <GrantsSection
            type="region"
            region={st.region}
            searchParams={query}
          />
        </div>
      </Home>
    );
  }

  const { countryData } = region;
  const countryName = countryData.name;
  const countryCode = countryData.code.toUpperCase();
  const organizationSchema = generateRegionalOrganizationSchema({
    displayValue: countryName,
    region: countryName,
    slug: region.slug,
    code: countryCode,
  });
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: countryName },
  ]);

  return (
    <Home type="region" countryData={countryData}>
      <JsonLdScripts data={[organizationSchema, breadcrumbSchema]} />
      <div className="w-full">
        <ListingsSection
          type="region"
          region={countryName}
          searchParams={query}
        />

        <GrantsSection
          type="region"
          region={countryName}
          searchParams={query}
        />
      </div>
    </Home>
  );
}
