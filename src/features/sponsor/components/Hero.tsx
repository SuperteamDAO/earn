import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import SereneDotGrid from '../icons/DotsGrid';
import { GridBg } from '../icons/GridBg';
import { ShaderGradient } from '../icons/ShaderGradient';
import { maxW } from '../utils/styles';
import { HighQualityImage } from './HighQualityImage';

export function Hero() {
  const { authenticated } = usePrivy();

  const { user } = useUser();

  const base = '/landingsponsor/sponsors/';

  function getStartedWhere(isAuthenticated: boolean, isSponsor: boolean) {
    if (!isAuthenticated) return '/new/sponsor';
    if (!isSponsor) return '/new/sponsor';
    return '/dashboard/listings/?open=1';
  }
  return (
    <div className="relative flex w-full flex-col items-center justify-start overflow-hidden pb-[4rem] md:pb-[1rem]">
      <div className="relative flex w-full flex-col items-center gap-8 bg-slate-50 px-8 pt-54 text-center">
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
        <div className="absolute top-[-16rem] left-2/4 -translate-x-2/4">
          <ShaderGradient />
        </div>
        <div className="absolute top-0 left-2/4 -translate-x-2/4">
          <SereneDotGrid />
        </div>

        <h1 className="max-w-[40rem] text-[2rem] leading-[1.1] font-semibold text-slate-800 md:text-[4rem]">
          Ship Faster With 150K Solana Freelancers
        </h1>

        <div className="flex w-full flex-col justify-center gap-8 pb-8">
          <Link
            className="ph-no-capture"
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

        {/* <div className="absolute bottom-[-12rem] h-[12rem] w-full bg-slate-50" /> */}
      </div>

      <div
        className={cn(
          'relative z-10 mx-auto mt-8 mb-[3.125rem] flex h-28 w-full flex-wrap items-center justify-around gap-5',
          'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
          maxW,
        )}
      >
        <HighQualityImage
          src={base + 'squads.webp'}
          alt="Squads Logo"
          className="h-6"
        />
        <HighQualityImage
          src={base + 'tensor.webp'}
          alt="Tensor Logo"
          className="h-8"
        />
        <HighQualityImage
          src={base + 'jupiter.webp'}
          alt="Jupiter Logo"
          className="h-6"
        />
        <HighQualityImage
          src={base + 'de.webp'}
          alt="De Logo"
          className="h-12"
        />
        <HighQualityImage
          src={base + 'madlads.webp'}
          alt="Madlads  Logo"
          className="h-10"
        />
        <HighQualityImage
          src={base + 'solflare.webp'}
          alt="Solflare Logo"
          className="h-10"
        />
        <HighQualityImage
          src={base + 'meteora.webp'}
          alt="Meteroa Logo"
          className="h-8"
        />
        <HighQualityImage
          src={base + 'monkedao.webp'}
          alt="MonkeDao Logo"
          className="h-6"
        />
        <HighQualityImage
          src={base + 'bonk.webp'}
          alt="Bonk Logo"
          className="h-8"
        />
      </div>
    </div>
  );
}
