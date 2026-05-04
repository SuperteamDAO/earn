import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { JsonLd } from '@/components/shared/JsonLd';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { generateSuperteamChaptersSchema } from '@/utils/json-ld';

import Collab from '@/features/stfun/components/sections/Collab';
import Geographies from '@/features/stfun/components/sections/Geographies';
import Hero from '@/features/stfun/components/sections/Hero';
import LoveRespect from '@/features/stfun/components/sections/LoveRespect';
import Production from '@/features/stfun/components/sections/Production';

interface HomePageProps {
  readonly chapters: Array<{
    name: string;
    region: string;
    displayValue: string;
    slug: string;
    code: string;
    country: string[];
    icons?: string | null;
    link?: string | null;
  }>;
  readonly chaptersForSchema: Array<{
    name: string;
    displayValue: string;
    slug: string;
    code: string;
    country: string[];
    icons?: string | null;
    link?: string | null;
  }>;
}

function parseCountries(rawCountries: unknown): string[] {
  if (!Array.isArray(rawCountries)) return [];
  return rawCountries.filter(
    (country): country is string => typeof country === 'string',
  );
}

export default function Home({ chapters, chaptersForSchema }: HomePageProps) {
  return (
    <>
      <Meta
        title="Superteam | The Talent Layer of Solana"
        description="Superteam is a community of the best talent learning, earning and building in crypto."
        canonical="https://superteam.fun/"
        og={`${ASSET_URL}/st/og/og-home.png`}
      />
      <JsonLd data={generateSuperteamChaptersSchema(chaptersForSchema)} />
      <Head>
        <link
          rel="preload"
          as="image"
          href={`${ASSET_URL}/st/hero/hero_home0.5x.webp`}
          // @ts-expect-error fetchpriority is a valid attribute but not typed
          imagesrcset={`${ASSET_URL}/st/hero/hero_home0.5x.webp 640w, ${ASSET_URL}/st/hero/hero_home.webp 1440w, ${ASSET_URL}/st/hero/hero_home1.5x.webp 2560w`}
          imagesizes="(max-width: 640px) 100vw, (max-width: 1440px) 100vw, 2560px"
        />
      </Head>

      <Hero
        line1="Join The Talent Layer"
        line2="of Solana"
        line3="superteam is a community of the best talent learning,"
        line4="earning and building in crypto"
        buttonVisible={false}
      />

      <Geographies chapters={chapters} />

      <Production />

      <LoveRespect />

      <Collab />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<
  HomePageProps
> = async () => {
  const chapters = await prisma.chapter.findMany({
    where: { active: true },
    select: {
      name: true,
      region: true,
      displayValue: true,
      slug: true,
      code: true,
      countries: true,
      icons: true,
      link: true,
    },
  });

  const chaptersForSchema = chapters.map((chapter) => ({
    name: chapter.name,
    displayValue: chapter.displayValue || chapter.name,
    slug: chapter.slug,
    code: chapter.code || '',
    country: parseCountries(chapter.countries),
    icons: chapter.icons ?? null,
    link: chapter.link ?? null,
  }));

  const chaptersForGeographies = chapters.map((chapter) => ({
    name: chapter.name,
    region: chapter.region,
    displayValue: chapter.displayValue || chapter.region,
    slug: chapter.slug,
    code: chapter.code || '',
    country: parseCountries(chapter.countries),
    icons: chapter.icons ?? null,
    link: chapter.link ?? null,
  }));

  return {
    props: {
      chapters: chaptersForGeographies,
      chaptersForSchema,
    },
  };
};
