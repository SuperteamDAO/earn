import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';

import FastTrackContainer from '@/features/stfun/components/common/FastTrackContainer';
import Accelerator from '@/features/stfun/components/sections/Accelerator';
import FastTrackFaq from '@/features/stfun/components/sections/FastTrackFaq';

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

export default function FastTrack() {
  return (
    <>
      <Meta
        title="Fast Track | Accelerate Your Solana Idea"
        description="Global Superteam Members can receive perks & personalized support when applying to acceleration & incubation programs."
        canonical="https://superteam.fun/fast-track/"
        og={`${ASSET_URL}/st/og/og-fast-track.png`}
      />

      <div className="col-span-5 flex min-h-[calc(100vh-72px)] flex-col">
        <section className="hero relative col-span-5 flex h-[calc(100vh-40px-32px)] flex-col items-center">
          <FastTrackContainer
            line1="Fast track your idea"
            line2="out of the sandbox"
            line3="Global Superteam Members can receive perks & personalized support"
            line4=" when applying to the following acceleration & incubation programs."
          />
          <div className="hero-bg fast-track-hero-bg absolute top-0 left-0 overflow-hidden">
            <div
              className="stars stars-no-fade"
              style={{ boxShadow: stars1Shadow }}
            ></div>
            <div
              className="stars2 stars2-no-fade"
              style={{ boxShadow: stars2Shadow }}
            ></div>
            <div
              className="stars3 stars3-no-fade"
              style={{ boxShadow: stars3Shadow }}
            ></div>
            <div className="hero-bg-image relative z-2 h-full w-full overflow-hidden">
              <img
                src={`${ASSET_URL}/st/fast-tracks/Hero.png`}
                loading="eager"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <div className="flex-1">
          <Accelerator />
          <FastTrackFaq />
        </div>
      </div>
    </>
  );
}
