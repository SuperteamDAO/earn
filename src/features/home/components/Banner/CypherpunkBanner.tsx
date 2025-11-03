import { useQuery } from '@tanstack/react-query';
import { getImageProps } from 'next/image';
import Link from 'next/link';
import posthog from 'posthog-js';

import { statsDataQuery } from '@/queries/hackathon';
import { CypherpunkLogo } from '@/svg/cypherpunk-logo';
import { cn } from '@/utils/cn';
import { roundToNearestTenThousand } from '@/utils/number';

export function HomeCypherpunkBanner() {
  const common = {
    alt: 'Illustration — Gradient Light blue with Logos of Solana first Companies',
    quality: 85,
    loading: 'lazy' as const,
    style: {
      width: '100%',
      maxWidth: '100%',
      borderRadius: '0.375rem',
      pointerEvents: 'none' as const,
      objectFit: 'contain' as const,
    },
  };

  const {
    props: { srcSet: desktop, ...rest },
  } = getImageProps({
    ...common,
    src: `https://res.cloudinary.com/dgvnuwspr/image/upload/v1758358378/assets/hackathon/cypherpunk/home-banner-wide.webp`,
    width: 1200,
    height: 600,
    sizes: '40vw',
  });
  const {
    props: { srcSet: mobile },
  } = getImageProps({
    ...common,
    src: ``,
    width: 800,
    height: 600,
    sizes: '30vw',
  });

  const { data: stats } = useQuery(statsDataQuery('cypherpunk'));

  return (
    <Link
      href="/hackathon/cypherpunk"
      className="relative mx-auto flex h-full w-full flex-col items-start overflow-hidden rounded-[0.5rem] p-5 md:p-10"
      prefetch={false}
    >
      <div className="absolute inset-0 overflow-hidden bg-[#F8F5FF]">
        <picture
          className={cn(
            'hidden sm:absolute sm:top-0 sm:right-0 sm:z-10 sm:flex sm:h-[70%] sm:w-fit',
            'md:relative md:ml-auto md:block md:h-full',
            'lg:absolute lg:top-0 lg:right-0 lg:z-10 lg:flex lg:h-[45%] sm:lg:h-[70%]',
            'xl:relative xl:ml-auto xl:block xl:h-full',
          )}
        >
          <source media="(min-width: 80em)" srcSet={desktop} />
          <source
            media="(min-width: 64em) and (max-width: 80em)"
            srcSet={mobile}
          />
          <source
            media="(min-width: 48em) and (max-width: 64em)"
            srcSet={desktop}
          />
          <source media="(max-width: 48em)" srcSet={mobile} />
          <img
            {...rest}
            className="h-full !w-auto"
            alt={rest.alt}
            decoding="async"
          />
        </picture>
      </div>
      <CypherpunkLogo className="relative z-10 mb-4 h-6 w-auto max-w-[60%] sm:hidden" />
      <p className="relative z-10 max-w-[25rem] text-xl leading-[120%] font-semibold text-black md:max-w-[30rem] md:text-[28px]">
        Are you a dev? We have prizes worth $
        {roundToNearestTenThousand(
          stats?.totalRewardAmount ?? 0,
          true,
        )?.toLocaleString('en-us') || '0'}
        + for you
      </p>
      <p className="relative z-10 mt-3 max-w-none text-sm leading-[130%] text-black/80 sm:max-w-[27rem] md:max-w-[30rem] md:text-lg lg:max-w-[30rem] xl:max-w-[30rem]">
        Explore sidetracks worth $
        {roundToNearestTenThousand(
          stats?.totalRewardAmount ?? 0,
          true,
        )?.toLocaleString('en-us') || '0'}
        + for Cypherpunk, Solana&apos;s latest global hackathon
      </p>
      <div className="relative z-10 mt-auto flex w-full flex-col items-center gap-3 pt-4 pb-2 md:flex-row md:gap-4">
        <button
          className="ph-no-capture bg-primary hover:bg-primary/80 w-full rounded-md px-9 py-3 text-sm font-semibold text-white md:w-auto"
          onClick={() => {
            posthog.capture('cypherpunk_banner');
          }}
        >
          View Tracks
        </button>
      </div>
    </Link>
  );
}
