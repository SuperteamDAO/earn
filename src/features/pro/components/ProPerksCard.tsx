'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { proPerksQuery } from '../queries/pro-perks';

interface ProPerkCardProps {
  perk: {
    id: string;
    header: string;
    description: string;
    cta: string;
    logo: string;
    ctaLink?: string;
  };
}

interface ProPerksCardsProps {
  className?: string;
}

const ProPerkCard = ({ perk }: ProPerkCardProps) => {
  const { user } = useUser();
  const { authenticated } = usePrivy();
  const isPro = user?.isPro ?? false;
  const hasCtaLink = Boolean(perk.ctaLink);
  const shouldShowCta = authenticated && isPro && hasCtaLink;

  return (
    <div className="w-full rounded-xl border border-slate-100 bg-zinc-100 px-4 pt-6 pb-8">
      <div className="flex flex-col items-start gap-3">
        <img
          src={perk.logo}
          alt={perk.header}
          className="size-10 rounded-md object-contain"
        />

        <h3 className="text-lg font-semibold text-zinc-800">{perk.header}</h3>
        <p className="text-zinc-600">{perk.description}</p>
        {shouldShowCta && (
          <Button
            className="mt-2 w-full rounded-lg bg-zinc-800 font-semibold text-white shadow transition-all hover:bg-zinc-900 hover:shadow-lg"
            onClick={() => {
              posthog.capture('clicked pro_perk');
              if (perk.ctaLink) {
                window.open(perk.ctaLink, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            {perk.cta}
          </Button>
        )}
      </div>
    </div>
  );
};

export const ProPerksCards = ({ className }: ProPerksCardsProps) => {
  const { data: perks, isLoading } = useQuery(proPerksQuery);
  const shouldShowCta = perks?.some((perk) => Boolean(perk.ctaLink));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const updateScrollShadows = useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    const tolerance = 1;
    const hasScrollableContent =
      element.scrollHeight - element.clientHeight > 1;

    if (!hasScrollableContent) {
      setShowTopShadow(false);
      setShowBottomShadow(false);
      return;
    }

    setShowTopShadow(element.scrollTop > tolerance);
    const bottomDistance =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    setShowBottomShadow(bottomDistance > tolerance);
  }, []);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    const frameId = requestAnimationFrame(updateScrollShadows);
    const resizeObserver = new ResizeObserver(updateScrollShadows);
    resizeObserver.observe(element);
    if (element.firstElementChild) {
      resizeObserver.observe(element.firstElementChild);
    }

    element.addEventListener('scroll', updateScrollShadows, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      element.removeEventListener('scroll', updateScrollShadows);
      resizeObserver.disconnect();
    };
  }, [updateScrollShadows, perks?.length, shouldShowCta]);

  if (isLoading) {
    return (
      <div className={cn('mt-4 min-h-0', className)}>
        <div className="hide-scrollbar flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-2 lg:h-full lg:max-h-none">
          <div className="h-24 animate-pulse rounded-lg bg-zinc-200" />
          <div className="h-24 animate-pulse rounded-lg bg-zinc-200" />
        </div>
      </div>
    );
  }

  if (!perks || perks.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative mt-4 min-h-0 overflow-hidden rounded-xl',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-20 h-36',
          'bg-linear-to-b from-white/95 via-white/70 to-transparent',
          'transition-opacity duration-200',
          showTopShadow ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={scrollContainerRef}
        className={cn(
          'hide-scrollbar max-h-[70vh] overflow-y-auto pt-2 lg:h-full lg:max-h-none',
          shouldShowCta ? 'pb-10' : 'pb-8',
        )}
      >
        <div className="flex flex-col gap-4">
          {perks.map((perk) => (
            <ProPerkCard key={perk.id} perk={perk} />
          ))}
        </div>
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40',
          'bg-linear-to-t from-white/95 via-white/70 to-transparent',
          'transition-opacity duration-200',
          showBottomShadow ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center',
          'transition-opacity duration-200',
          showBottomShadow ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium tracking-[0.01em] text-slate-500 ring-1 ring-slate-200/70 backdrop-blur-[2px]">
          Scroll for more <span aria-hidden="true">↓</span>
        </span>
      </div>
    </div>
  );
};
