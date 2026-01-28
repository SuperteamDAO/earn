import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';

import HeroContainer from '@/features/stfun/components/common/HeroContainer';
import CollabServices from '@/features/stfun/components/sections/CollabServices';
import LoveRespect from '@/features/stfun/components/sections/LoveRespect';

// Pre-generate stars at module level for consistency
function generateStars(count: number, width: number, height: number): string {
  const stars = [];
  let seed = count;
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const x = Math.floor(seededRandom() * width);
    const y = Math.floor(seededRandom() * height * 2);
    stars.push(`${x}px ${y}px #FFF`);
  }
  return stars.join(', ');
}

const stars1Shadow = generateStars(500, 2560, 2560);
const stars2Shadow = generateStars(200, 2560, 2560);
const stars3Shadow = generateStars(200, 2560, 2560);

const stars1AfterShadow = generateStars(500, 2560, 2560);
const stars2AfterShadow = generateStars(200, 2560, 2560);
const stars3AfterShadow = generateStars(200, 2560, 2560);

export default function Collaborate() {
  return (
    <>
      <Meta
        title="Work with Superteam | Access the Best Talent on Solana"
        description="Get access to the best talent on Solana. Superteam is the forefront community for web3, powered by Solana."
        canonical="https://superteam.fun/collaborate/"
        og={`${ASSET_URL}/st/og/og-collaborate.png`}
      />

      <div className="col-span-5 h-fit">
        <section className="hero relative col-span-5 flex h-[calc(100vh-40px-32px)] flex-col items-center">
          <HeroContainer
            line1="get access to"
            line2="the best talent on Solana"
            line3="superteam is the forefront community for web3,"
            line4="powered by solana."
            buttonVisible={false}
          />
          <div className="hero-bg absolute top-0 left-0 overflow-hidden">
            <div
              className="stars stars-no-fade"
              style={{ boxShadow: stars1Shadow }}
            >
              <div
                className="stars-after"
                style={{ boxShadow: stars1AfterShadow }}
              />
            </div>
            <div
              className="stars2 stars2-no-fade"
              style={{ boxShadow: stars2Shadow }}
            >
              <div
                className="stars2-after"
                style={{ boxShadow: stars2AfterShadow }}
              />
            </div>
            <div
              className="stars3 stars3-no-fade"
              style={{ boxShadow: stars3Shadow }}
            >
              <div
                className="stars3-after"
                style={{ boxShadow: stars3AfterShadow }}
              />
            </div>
            <div className="relative z-2 h-full w-full">
              <img
                src={`${ASSET_URL}/st/hero/hero_collaborate.png`}
                srcSet={`${ASSET_URL}/st/hero/hero_collaborate0.5x.png 640w, ${ASSET_URL}/st/hero/hero_collaborate.png 1440w, ${ASSET_URL}/st/hero/hero_collaborate1.5x.png 2560w`}
                sizes="(max-width: 640px) 100vw, (max-width: 1440px) 100vw, 2560px"
                loading="eager"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <CollabServices />

        <LoveRespect collab={true} />
      </div>
    </>
  );
}
