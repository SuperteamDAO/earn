import Link from 'next/link';
import posthog from 'posthog-js';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { cn } from '@/utils/cn';

interface SidebarPosterProps {
  className?: string;
}

export function SidebarBanner({ className }: SidebarPosterProps) {
  return (
    <Link
      href="/earn/hackathon/crypto-worlds-fair"
      className="group mt-5 block rounded-lg focus-visible:ring-2 focus-visible:ring-[#65496F] focus-visible:ring-offset-2"
      prefetch={false}
      onClick={() => {
        posthog.capture('crypto_world_fair_sidebar_banner');
      }}
    >
      <div
        className={cn(
          'relative flex h-fit w-full flex-col items-center rounded-lg border border-[#65496F]/10 bg-[#65496F]/5 p-2',
          className,
        )}
      >
        <div className="w-full overflow-hidden rounded-md">
          <ExternalImage
            src="hackathon/crypto-world-fair/sidebar.png"
            alt="Crypto World's Fair"
            className="w-full object-contain"
          />
        </div>

        <div className="relative z-10 flex h-full w-full flex-col px-4 pt-2 pb-5 text-black">
          <h2 className="mt-2 text-lg leading-[120%] font-semibold text-slate-800">
            Build the onchain future at Crypto World&apos;s Fair
          </h2>
          <p className="mt-3 text-sm leading-[130%] text-slate-600 md:text-base">
            Join the ideas, technologies, and communities shaping what comes
            next onchain.
          </p>

          <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-[#65496F] px-4 text-base font-medium text-white transition-colors group-hover:bg-[#533D5B] group-focus-visible:bg-[#533D5B]">
            View Tracks
          </span>
        </div>
      </div>
    </Link>
  );
}
