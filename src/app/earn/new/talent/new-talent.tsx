'use client';

import { useBreakpoint } from '@/hooks/use-breakpoint';
import type { OnboardingStats } from '@/server/talent-directory';

import { TalentForm } from '@/features/talent/components/onboarding-form/Form';
import { TalentImageCard } from '@/features/talent/components/onboarding-form/ImageCard';

interface Props {
  suggestedUsername: string | null;
  countryCode: string | null;
  stats: OnboardingStats;
}

// Earn's talent onboarding: the form, and the side panel on wide screens.
export function NewTalent({ suggestedUsername, countryCode, stats }: Props) {
  const isMD = useBreakpoint('lg');
  return (
    <div className="grid h-full w-full grid-cols-1 grid-rows-1 lg:grid-cols-2">
      <div className="mx-auto max-w-3xl px-4 lg:mx-0 lg:ml-auto lg:w-full lg:pr-12 lg:pl-24">
        <TalentForm
          suggestedUsername={suggestedUsername}
          countryCode={countryCode}
        />
      </div>
      {isMD && (
        <div className="h-full max-h-[calc(100vh-3.5rem)] w-full">
          <TalentImageCard stats={stats} />
        </div>
      )}
    </div>
  );
}
