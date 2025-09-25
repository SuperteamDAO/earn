import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';

import SereneDotGrid from '../icons/DotsGrid';
import { GridBg } from '../icons/GridBg';
import { ShaderGradient } from '../icons/ShaderGradient';

export function Hero() {
  const { authenticated } = usePrivy();

  const { user } = useUser();

  function getStartedWhere(isAuthenticated: boolean, isSponsor: boolean) {
    if (!isAuthenticated) return '/new/sponsor';
    if (!isSponsor) return '/new/sponsor';
    return '/dashboard/listings/?open=1';
  }
  return (
    <div className="relative flex w-full flex-col items-center justify-start overflow-hidden pb-[4rem] md:pb-[1rem]">
      <div className="relative flex w-full flex-col items-center gap-8 bg-slate-50 px-8 pt-30 text-center md:pt-54">
        <div>
          <div className="absolute top-0 left-0 flex opacity-20">
            <GridBg />
            <GridBg />
            <GridBg />
            <GridBg />
            <GridBg />
            <GridBg />
            <GridBg />
            <GridBg />
            <GridBg />
          </div>
        </div>
        <div className="absolute top-[-16rem] md:left-2/4 md:-translate-x-2/4">
          <ShaderGradient className="w-[100%] scale-125 md:w-auto md:scale-100" />
        </div>
        <div className="absolute top-0 left-2/4 -translate-x-2/4">
          <SereneDotGrid />
        </div>

        <h1 className="max-w-[40rem] text-[2.8rem] leading-[1.1] font-semibold text-slate-800 md:text-[4rem]">
          Ship Faster With 150K Solana Freelancers
        </h1>

        <div className="flex w-full flex-col justify-center gap-8 pt-10 pb-8">
          <Link
            className="ph-no-capture mx-auto w-fit"
            href={getStartedWhere(authenticated, !!user?.currentSponsorId)}
            onClick={() => {
              posthog?.capture('clicked_hero_get_started');
            }}
          >
            <Button
              className="relative mx-auto h-[3.125rem] w-[12.5rem] items-center rounded-[0.4rem] bg-indigo-600 text-lg font-medium text-white"
              variant="default"
            >
              Post for Free 🙌
              {/* <LucideChevronRight className="absolute top-2/4 right-4 !size-4 -translate-y-2/4" /> */}
            </Button>
          </Link>
          <p className="text-xl font-medium text-slate-500">
            Trusted by Top Teams on Solana
          </p>
        </div>
      </div>
    </div>
  );
}
