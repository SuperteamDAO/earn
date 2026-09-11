import { type GetServerSideProps } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';

import HeroContainer from '@/features/stfun/components/common/HeroContainer';
import PerksGrid, {
  type Perk,
} from '@/features/stfun/components/grids/PerksGrid';

interface MemberPerksProps {
  liveNow: Perk[];
  completed: Perk[];
  comingSoon: Perk[];
}

export default function MemberPerks({
  liveNow,
  completed,
  comingSoon,
}: MemberPerksProps) {
  return (
    <>
      <Meta
        title="Member Perks | Exclusive Benefits for Superteam Members"
        description="Being a Superteam member comes with many perks. Explore exclusive perks available to members around the world."
        canonical="https://superteam.fun/member-perks/"
        og={`${ASSET_URL}/st/og/og-member-perks.png`}
      />

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

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const perks = await prisma.publicMemberPerk.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        link: true,
        imageUrl: true,
        status: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const liveNow = perks.filter((perk) => perk.status === 'Live now');
    const completed = perks.filter((perk) => perk.status === 'Completed');
    const comingSoon = perks.filter((perk) => perk.status === 'Coming Soon');

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    return {
      props: {
        liveNow,
        completed,
        comingSoon,
      },
    };
  } catch (error: unknown) {
    console.error('Unexpected error fetching member perks from DB:', error);

    res.setHeader('Cache-Control', 'no-store');
    return {
      props: {
        liveNow: [],
        completed: [],
        comingSoon: [],
      },
    };
  }
};
