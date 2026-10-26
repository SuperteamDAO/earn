import { ASSET_URL } from '@/constants/ASSET_URL';
import { pageMetadata } from '@/lib/metadata';
import * as MemberPerks from '@/server/member-perks';
import { runtime } from '@/server/runtime';

import HeroContainer from '@/features/stfun/components/common/HeroContainer';
import PerksGrid from '@/features/stfun/components/grids/PerksGrid';

export const metadata = pageMetadata({
  site: 'st',
  title: 'Member Perks | Exclusive Benefits for Superteam Members',
  description:
    'Being a Superteam member comes with many perks. Explore exclusive perks available to members around the world.',
  canonical: 'https://superteam.fun/member-perks/',
  og: `${ASSET_URL}/st/og/og-member-perks.png`,
});

export default async function MemberPerksPage() {
  const { liveNow, completed, comingSoon } = await runtime.runPromise(
    MemberPerks.MemberPerks.use((perks) => perks.list),
  );

  return (
    <>
      <img
        src={`${ASSET_URL}/st/images/project-bg-lg.webp`}
        srcSet={`${ASSET_URL}/st/images/project-bg-sm.webp 640w, ${ASSET_URL}/st/images/project-bg-lg.webp 1440w, ${ASSET_URL}/st/images/project-bg-xl.webp 2560w`}
        sizes="(max-width: 640px) 100vw, (max-width: 1440px) 100vw, 2560px"
        loading="eager"
        alt=""
        className="absolute top-0 left-0 -mt-[72px] w-full object-cover"
      />

      <section className="relative col-span-5 flex flex-col items-center pb-[100px]">
        <img
          src={`${ASSET_URL}/st/images/stars-bg.webp`}
          alt=""
          className="stars-bg"
        />
        <HeroContainer
          line1="Exclusive Perks"
          line2="for Members"
          line3="being a superteam member comes with many perks,"
          line4="check them out below."
          buttonVisible={false}
        />

        {liveNow.length > 0 && (
          <>
            <p className="section-heading center-text mt-[128px] mb-[48px] text-[24px] leading-[26px] md:text-[32px] lg:mb-0 lg:leading-[35px]">
              Live Now
            </p>
            <PerksGrid perks={liveNow} />
          </>
        )}

        {completed.length > 0 && (
          <>
            <p className="section-heading center-text mt-[128px] mb-[48px] text-[24px] leading-[26px] md:text-[32px] lg:mb-0 lg:leading-[35px]">
              Completed
            </p>
            <PerksGrid perks={completed} />
          </>
        )}

        {comingSoon.length > 0 && (
          <>
            <p className="section-heading center-text mt-[128px] mb-[48px] text-[24px] leading-[26px] md:text-[32px] lg:mb-0 lg:leading-[35px]">
              Coming Soon
            </p>
            <PerksGrid perks={comingSoon} />
          </>
        )}
      </section>
    </>
  );
}
