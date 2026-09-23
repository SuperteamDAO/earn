import Autoplay from 'embla-carousel-autoplay';
import { useAtomValue } from 'jotai';
import Link from 'next/link';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from '@/components/ui/carousel';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { cn } from '@/utils/cn';

import {
  popupOpenAtom,
  popupsShowedAtom,
} from '@/features/conversion-popups/atoms';

interface SidebarPosterProps {
  className?: string;
}

export function SidebarBanner({ className }: SidebarPosterProps) {
  const plugin = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnFocusIn: false,
    }),
  );
  const isPopupOpen = useAtomValue(popupOpenAtom);
  const popupsShowed = useAtomValue(popupsShowedAtom);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>(
    undefined,
  );

  useEffect(() => {
    const autoplay = carouselApi?.plugins()?.autoplay;

    if (!autoplay) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      autoplay.stop();
      return undefined;
    }

    if (isPopupOpen) {
      autoplay.stop();
      return undefined;
    }

    if (popupsShowed > 0) {
      const resumeTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
        carouselApi.scrollNext();
        plugin.current.options.delay = 5000;
        autoplay.play();
      }, 2000);

      return () => clearTimeout(resumeTimer);
    }

    return undefined;
  }, [isPopupOpen, carouselApi, popupsShowed]);

  return (
    <Carousel
      plugins={[plugin.current]}
      className="mt-5 w-full"
      opts={{ loop: true }}
      setApi={setCarouselApi}
    >
      <CarouselContent>
        <CarouselItem>
          <CryptoWorldFairSidebarBanner className={className} />
        </CarouselItem>
        <CarouselItem>
          <NextStopBreakpointSidebarBanner className={className} />
        </CarouselItem>
      </CarouselContent>
      <CarouselDots
        className="absolute top-3 right-3 mt-0 rounded-full bg-white/80 p-1.5 shadow-sm"
        activeDotClassName="bg-[#65496F]"
        dotClassName="bg-slate-300"
      />
    </Carousel>
  );
}

function CryptoWorldFairSidebarBanner({ className }: SidebarPosterProps) {
  return (
    <Link
      href="/earn/hackathon/crypto-worlds-fair"
      className="group block rounded-lg focus-visible:ring-2 focus-visible:ring-[#65496F] focus-visible:ring-offset-2"
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
            Are you a dev? We have prizes worth $197,000+ for you
          </h2>
          <p className="mt-3 text-sm leading-[130%] text-slate-600 md:text-base">
            Submit to any of the Crypto World&apos;s Fair sidetracks on Earn and
            stand to win from $197,000+. Deadline for submissions is 13 Oct
            (6:59 AM UTC).
          </p>

          <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-[#65496F] px-4 text-base font-medium text-white transition-colors group-hover:bg-[#533D5B] group-focus-visible:bg-[#533D5B]">
            View Tracks
          </span>
        </div>
      </div>
    </Link>
  );
}

function NextStopBreakpointSidebarBanner({ className }: SidebarPosterProps) {
  return (
    <Link
      href="/earn/next-stop-breakpoint"
      className="group block rounded-lg focus-visible:ring-2 focus-visible:ring-[#65496F] focus-visible:ring-offset-2"
      prefetch={false}
      onClick={() => {
        posthog.capture('next_stop_breakpoint_sidebar_banner');
      }}
    >
      <div
        className={cn(
          'relative flex h-fit w-full flex-col items-center rounded-lg border border-[#65496F]/10 bg-[#65496F]/5 p-2',
          className,
        )}
      >
        <div className="aspect-video w-full overflow-hidden rounded-md">
          <ExternalImage
            src="hackathon/next-stop-breakpoint/road-to-bp.png"
            alt="Next Stop Breakpoint"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative z-10 flex h-full w-full flex-col px-4 pt-2 pb-5 text-black">
          <h2 className="mt-2 text-lg leading-[120%] font-semibold text-slate-800">
            Create creative content, win ticket to Breakpoint
          </h2>
          <p className="mt-3 text-sm leading-[130%] text-slate-600 md:text-base">
            Take on Next Stop Breakpoint bounties on Earn for a chance to win a
            Breakpoint ticket worth the stated prize amount.
          </p>

          <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-[#65496F] px-4 text-base font-medium text-white transition-colors group-hover:bg-[#533D5B] group-focus-visible:bg-[#533D5B]">
            View Bounties
          </span>
        </div>
      </div>
    </Link>
  );
}
