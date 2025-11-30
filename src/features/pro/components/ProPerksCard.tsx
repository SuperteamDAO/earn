'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import posthog from 'posthog-js';

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

const ProPerkCard = ({ perk }: ProPerkCardProps) => {
  const { user } = useUser();
  const { authenticated } = usePrivy();
  const isPro = user?.isPro ?? false;
  const hasCtaLink = Boolean(perk.ctaLink);
  const shouldShowCta = authenticated && isPro && hasCtaLink;

  return (
    <div className="w-full rounded-xl border border-slate-100 bg-[#F8FAFC] px-4 pt-6 pb-8">
      <div className="flex flex-col items-start gap-3">
        <img
          src={perk.logo}
          alt={perk.header}
          className="size-10 rounded-md object-contain"
        />

        <h3 className="text-lg font-semibold text-slate-800">{perk.header}</h3>
        <p className="text-slate-500">{perk.description}</p>
        {shouldShowCta && (
          <Button
            className="mt-2 w-full rounded-lg bg-white font-semibold text-slate-500 shadow transition-all hover:bg-slate-100 hover:shadow-lg"
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

export const ProPerksCards = () => {
  const { data: perks, isLoading } = useQuery(proPerksQuery);
  const shouldShowCta = perks?.some((perk) => Boolean(perk.ctaLink));

  if (isLoading) {
    return (
      <div className="mt-4 max-h-150 overflow-y-auto">
        <div className="flex flex-col gap-4 pr-2">
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
        'mt-4 overflow-y-auto pb-10',
        shouldShowCta ? 'max-h-180' : 'max-h-140',
      )}
    >
      <div className="flex flex-col gap-4 pr-2">
        {perks.map((perk) => (
          <ProPerkCard key={perk.id} perk={perk} />
        ))}
      </div>
    </div>
  );
};
