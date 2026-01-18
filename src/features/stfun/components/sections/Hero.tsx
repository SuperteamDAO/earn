'use client';

import { type ReactNode, useEffect } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { gsap } from '@/lib/gsap';

import HeroContainer from '../common/HeroContainer';

interface HeroProps {
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
  buttonVisible?: boolean;
  children?: ReactNode;
}

// Pre-generate stars at module level for consistency
function generateStars(
  count: number,
  width: number,
  height: number,
  seedOffset: number = 0,
): string {
  const stars = [];
  let seed = count + seedOffset;
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

// Generate stars concentrated in top portion only
function generateTopStars(
  count: number,
  width: number,
  height: number,
  seedOffset: number = 0,
): string {
  const stars = [];
  let seed = count + seedOffset;
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const x = Math.floor(seededRandom() * width);
    // 90% of stars in top 40%, 10% scattered in rest
    const rand = seededRandom();
    let y: number;
    if (rand < 0.9) {
      y = Math.floor(seededRandom() * height * 0.4); // Top 40%
    } else {
      y = Math.floor(height * 0.4 + seededRandom() * height * 0.6); // Bottom 60% (very sparse)
    }
    stars.push(`${x}px ${y}px #FFF`);
  }
  return stars.join(', ');
}

// Match Svelte star counts: 1700, 700, 200
const stars1Shadow = generateTopStars(1700, 2560, 2560, 0);
const stars2Shadow = generateTopStars(700, 2560, 2560, 0);
const stars3Shadow = generateTopStars(200, 2560, 2560, 0);
// After shadows for seamless loop (these use normal distribution since they're for the loop)
const stars1AfterShadow = generateStars(500, 2560, 2560, 10000);
const stars2AfterShadow = generateStars(200, 2560, 2560, 20000);
const stars3AfterShadow = generateStars(50, 2560, 2560, 30000);

export default function Hero({
  line1 = '',
  line2 = '',
  line3 = '',
  line4 = '',
  buttonVisible = true,
  children,
}: HeroProps) {
  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      '.fade-in',
      { y: 0, opacity: 0 },
      {
        opacity: 1,
        duration: 1.8,
        ease: 'power4.out',
      },
    );
  }, []);

  return (
    <section className="st-hero relative col-span-5 flex h-[calc(100vh-40px-32px)] flex-col items-center">
      <HeroContainer
        line1={line1}
        line2={line2}
        line3={line3}
        line4={line4}
        buttonVisible={buttonVisible}
      >
        {children}
      </HeroContainer>
      <div className="hero-bg absolute top-0 left-0 overflow-hidden">
        <div
          className="stars fade-in opacity-0"
          style={{ boxShadow: stars1Shadow }}
        >
          <div
            className="stars-after"
            style={{ boxShadow: stars1AfterShadow }}
          />
        </div>
        <div
          className="stars2 fade-in opacity-0"
          style={{ boxShadow: stars2Shadow }}
        >
          <div
            className="stars2-after"
            style={{ boxShadow: stars2AfterShadow }}
          />
        </div>
        <div
          className="stars3 fade-in opacity-0"
          style={{ boxShadow: stars3Shadow }}
        >
          <div
            className="stars3-after"
            style={{ boxShadow: stars3AfterShadow }}
          />
        </div>
        <div className="relative z-2 h-full w-full">
          <img
            src={`${ASSET_URL}/st/hero/hero_home.webp`}
            srcSet={`${ASSET_URL}/st/hero/hero_home0.5x.webp 640w, ${ASSET_URL}/st/hero/hero_home.webp 1440w, ${ASSET_URL}/st/hero/hero_home1.5x.webp 2560w`}
            sizes="(max-width: 640px) 100vw, (max-width: 1440px) 100vw, 2560px"
            loading="eager"
            // @ts-expect-error fetchpriority is a valid attribute but not typed
            fetchpriority="high"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
