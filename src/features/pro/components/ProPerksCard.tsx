'use client';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';

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
  const isPro = user?.isPro ?? false;
  const hasCtaLink = Boolean(perk.ctaLink);

  return (
    <div className="bg- w-full rounded-xl bg-[#F8FAFC] p-4">
      <div className="flex flex-col items-start gap-3">
        <img
          src={perk.logo}
          alt={perk.header}
          className="size-10 rounded-md object-contain"
        />

        <h3 className="text-lg font-semibold text-slate-800">{perk.header}</h3>
        <p className="text-slate-500">{perk.description}</p>
        <Button
          disabled={!hasCtaLink || !isPro}
          className="mt-2 w-full bg-white font-semibold text-slate-500 hover:bg-slate-100"
          onClick={() => {
            if (hasCtaLink && perk.ctaLink) {
              window.open(perk.ctaLink, '_blank', 'noopener,noreferrer');
            }
          }}
        >
          {perk.cta}
        </Button>
      </div>
    </div>
  );
};

export const ProPerksCards = () => {
  const { data: perks, isLoading } = useQuery(proPerksQuery);

  if (isLoading) {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <div className="h-24 animate-pulse rounded-lg bg-zinc-200" />
        <div className="h-24 animate-pulse rounded-lg bg-zinc-200" />
      </div>
    );
  }

  if (!perks || perks.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {perks.map((perk) => (
        <ProPerkCard key={perk.id} perk={perk} />
      ))}
    </div>
  );
};
