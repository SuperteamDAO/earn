import Link from 'next/link';
import posthog from 'posthog-js';

import { ExternalImage } from '@/components/ui/cloudinary-image';

export function HomeCryptoWorldFairHackathonBanner() {
  return (
    <Link
      href="/earn/hackathon/crypto-worlds-fair"
      className="group relative mx-auto flex h-full min-h-64 w-full flex-col overflow-hidden rounded-lg p-5 text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#65496F] md:p-10"
      prefetch={false}
      onClick={() => {
        posthog.capture('crypto_world_fair_hackathon_banner');
      }}
    >
      <div className="absolute inset-0 overflow-hidden bg-[#65496F]">
        {/* <ExternalImage
          src="hackathon/crypto-world-fair/sidebar.png"
          alt=""
          className="h-full w-full object-cover object-center md:hidden"
          loading="eager"
        /> */}
        <ExternalImage
          src="hackathon/crypto-world-fair/bg-wo-logo.png"
          alt=""
          className="h-full w-full object-cover object-center md:block"
          loading="eager"
        />
      </div>
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" />

      <h1 className="relative z-10 max-w-[22rem] text-2xl leading-[120%] font-bold md:max-w-[30rem] md:text-[28px]">
        Build the onchain future at Crypto World&apos;s Fair
      </h1>
      <p className="relative z-10 mt-2.5 max-w-[30rem] text-sm leading-[130%] [text-shadow:_0_1px_2px_rgb(0_0_0_/1)] md:mt-4 md:text-lg">
        Join the ideas, technologies, and communities shaping what comes next
        onchain.
      </p>
      <div className="relative z-10 mt-auto flex pt-4">
        <span className="ph-no-capture inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[#65496F] px-9 py-3 text-sm font-medium text-white transition-colors group-hover:bg-[#533D5B] group-focus-visible:bg-[#533D5B] md:w-auto">
          View Tracks
        </span>
      </div>
    </Link>
  );
}
