import Head from 'next/head';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';

import Collab from '@/features/stfun/components/sections/Collab';
import Geographies from '@/features/stfun/components/sections/Geographies';
import Hero from '@/features/stfun/components/sections/Hero';
import LoveRespect from '@/features/stfun/components/sections/LoveRespect';
import Partners from '@/features/stfun/components/sections/Partners';
import Production from '@/features/stfun/components/sections/Production';

export default function Home() {
  return (
    <>
      <Meta
        title="Superteam | The Talent Layer of Solana"
        description="Superteam is a community of the best talent learning, earning and building in crypto."
        canonical="https://superteam.fun/"
        og={`${ASSET_URL}/st/og/og-home.png`}
      />
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

      <Geographies />

      <Partners />

      <Production />

      <LoveRespect />

      <Collab />
    </>
  );
}
