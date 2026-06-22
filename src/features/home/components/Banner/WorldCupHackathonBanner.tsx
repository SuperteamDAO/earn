import Link from 'next/link';
import posthog from 'posthog-js';

import { ExternalImage } from '@/components/ui/cloudinary-image';

export function HomeWorldCupHackathonBanner() {
  return (
    <Link
      href="/earn/hackathon/world-cup"
      className="relative mx-auto flex h-full w-full flex-col items-start overflow-hidden rounded-[0.5rem] p-5 md:p-10"
      prefetch={false}
    >
      <div className="absolute inset-0 overflow-hidden bg-[#1E2C67]">
        <ExternalImage
          src="hackathon/world-cup/bg.png"
          alt="World Cup Hackathon stadium background"
          className="h-full w-full scale-x-[-1] object-cover object-center"
          loading="eager"
        />
      </div>
      <div className="absolute inset-0 bg-[#243C8E]/35" aria-hidden="true" />

      <h1 className="relative z-10 max-w-[22rem] text-2xl leading-[120%] font-bold text-white md:max-w-[30rem] md:text-[28px]">
        Don&apos;t just watch, win prizes worth $50K this World Cup!
      </h1>
      <p className="relative z-10 mt-2.5 max-w-[20rem] text-sm leading-[130%] text-white/90 md:mt-4 md:max-w-[25rem] md:text-lg">
        Build products or agents using TxLine&apos;s live World Cup data API on
        Solana. $50K across three tracks.
      </p>
      <button
        className="ph-no-capture relative z-10 mt-auto w-full rounded-md bg-[#6366F1] px-9 py-3 text-sm font-medium text-white hover:bg-[#5558E8] md:w-auto"
        onClick={() => {
          posthog.capture('world_cup_hackathon_banner');
        }}
      >
        View Tracks
      </button>
    </Link>
  );
}
