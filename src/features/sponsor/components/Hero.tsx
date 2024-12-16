import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

import { maxW } from '../utils';
import { HighQualityImage } from './HighQualityImage';
import { StepOne } from './steps/One';
import { StepThree } from './steps/Three';
import { StepTwo } from './steps/Two';

export function Hero() {
  const { data: session } = useSession();

  const { user } = useUser();

  const posthog = usePostHog();

  const base = '/landingsponsor/sponsors/';

  function getStartedWhere(authenticated: boolean, isSponsor: boolean) {
    if (!authenticated) return '/new/sponsor';
    if (!isSponsor) return '/new/sponsor';
    return '/dashboard/listings/?open=1';
  }
  return (
    <div className="relative flex w-full flex-col items-center justify-start overflow-hidden pb-[4rem] md:pb-[1rem]">
      <div className="relative flex w-full flex-col items-center gap-8 bg-slate-50 px-8 pt-36 text-center">
        <h1 className="max-w-[45rem] text-[2rem] font-semibold leading-[1.1] text-gray-700 md:text-[3.5rem]">
          Where Solana teams come to get sh*t done
        </h1>

        <p className="w-full max-w-[39rem] text-[1.25rem] font-medium text-gray-500 [text-wrap:pretty]">
          The world’s best Solana talent is on Superteam Earn. Get work done
          from the right people, at the right time.
        </p>

        <div className="flex w-full justify-center gap-8">
          <Link
            className="ph-no-capture"
            href={getStartedWhere(!!session, !!user?.currentSponsorId)}
            onClick={() => {
              posthog?.capture('clicked_hero_get_started');
            }}
          >
            <Button
              className="mx-auto h-[3.125rem] w-[12.5rem] rounded-[0.625rem] bg-[#6562FF] text-lg text-white"
              variant="default"
            >
              Get Started
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-[-12rem] h-[12rem] w-full bg-slate-50" />
      </div>

      <div
        className={cn(
          'relative mt-8 flex items-center gap-6',
          'flex-col md:flex-row md:gap-0',
          'scale-100 md:scale-[0.7] lg:scale-[0.8] xl:scale-100',
        )}
      >
        <div className="flex flex-col items-start">
          <StepOne />
          <div className="flex gap-2">
            <p className="font-semibold text-slate-800">STEP 1</p>
            <p className="font-semibold text-slate-500">Create a profile</p>
          </div>
        </div>

        <div className="relative top-[-1rem] hidden md:block">
          <svg
            width="23"
            height="2"
            viewBox="0 0 23 2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0.5 1H23" stroke="#CBD5E1" />
          </svg>
        </div>

        <div className="flex flex-col items-start">
          <StepTwo />
          <div className="flex gap-2">
            <p className="font-semibold text-slate-800">STEP 2</p>
            <p className="font-semibold text-slate-500">Post your listing</p>
          </div>
        </div>

        <div className="relative top-[-1rem] hidden md:block">
          <svg
            width="24"
            height="216"
            viewBox="0 0 24 216"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 109H11.5M11.5 109V1H23.5M11.5 109H23.5M11.5 109V215.5H23.5"
              stroke="#CBD5E1"
            />
          </svg>
        </div>

        <div className="flex flex-col items-start">
          <StepThree />
          <div className="flex gap-2">
            <p className="font-semibold text-slate-800">STEP 3</p>
            <p className="font-semibold text-slate-500">Get submissions</p>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'mx-auto mb-[3.125rem] mt-8 flex h-28 w-full flex-wrap items-center justify-around gap-5',
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
