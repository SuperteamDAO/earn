import { preload } from 'react-dom';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { pageMetadata } from '@/lib/metadata';
import { runtime } from '@/server/runtime';
import * as SiteChapters from '@/server/site-chapters';
import { generateSuperteamChaptersSchema } from '@/utils/json-ld';

import Collab from '@/features/stfun/components/sections/Collab';
import Geographies from '@/features/stfun/components/sections/Geographies';
import Hero from '@/features/stfun/components/sections/Hero';
import LoveRespect from '@/features/stfun/components/sections/LoveRespect';
import Production from '@/features/stfun/components/sections/Production';

export const metadata = pageMetadata({
  site: 'st',
  title: 'Superteam | The Talent Layer of Solana',
  description:
    'Superteam is a community of the best talent learning, earning and building in crypto.',
  canonical: 'https://superteam.fun/',
  og: `${ASSET_URL}/st/og/og-home.png`,
});

export default async function Home() {
  const chapters = await runtime.runPromise(
    SiteChapters.SiteChapters.use((service) => service.list),
  );

  preload(`${ASSET_URL}/st/hero/hero_home0.5x.webp`, {
    as: 'image',
    imageSrcSet: `${ASSET_URL}/st/hero/hero_home0.5x.webp 640w, ${ASSET_URL}/st/hero/hero_home.webp 1440w, ${ASSET_URL}/st/hero/hero_home1.5x.webp 2560w`,
    imageSizes: '(max-width: 640px) 100vw, (max-width: 1440px) 100vw, 2560px',
  });

  const schema = generateSuperteamChaptersSchema(
    chapters.map((chapter) => ({
      name: chapter.name,
      displayValue: chapter.displayValue,
      slug: chapter.slug,
      code: chapter.code,
      country: [...chapter.country],
      icons: chapter.icons || undefined,
      link: chapter.link || undefined,
    })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        // oxlint-disable-next-line react/no-danger -- JSON-LD, with `<` escaped
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
        }}
      />

      <Hero
        line1="Join The Talent Layer"
        line2="of Solana"
        line3="superteam is a community of the best talent learning,"
        line4="earning and building in crypto"
        buttonVisible={false}
      />

      <Geographies
        chapters={chapters.map((chapter) => ({
          name: chapter.name,
          region: chapter.region,
          displayValue: chapter.displayValue,
          slug: chapter.slug,
          code: chapter.code,
          country: [...chapter.country],
          icons: chapter.icons || undefined,
          link: chapter.link || undefined,
        }))}
      />

      <Production />

      <LoveRespect />

      <Collab />
    </>
  );
}
