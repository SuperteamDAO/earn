import { useQuery } from '@tanstack/react-query';
import { getImageProps } from 'next/image';
import Link from 'next/link';
import posthog from 'posthog-js';

import { cn } from '@/utils/cn';
import { roundToNearestTenth, roundToNearestTenThousand } from '@/utils/number';

import { sponsorCountQuery } from '../../queries/sponsor-count';

interface HomeSponsorBannerProps {
  readonly totalUsers?: number | null;
}

export function HomeSponsorBanner({ totalUsers }: HomeSponsorBannerProps) {
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
    src: `https://res.cloudinary.com/dgvnuwspr/image/upload/assets/banner/banner-sponsor-logos`,
    width: 1200,
    height: 600,
    sizes: '40vw',
  });
  const {
    props: { srcSet: mobile },
  } = getImageProps({
    ...common,
    src: `https://res.cloudinary.com/dgvnuwspr/image/upload/assets/banner/banner-sponsor-logos-mobile`,
    width: 800,
    height: 600,
    sizes: '30vw',
  });

  const { data } = useQuery(sponsorCountQuery);
  return (
    <Link
      href="/sponsor"
      className="relative mx-auto flex h-full w-full flex-col items-start overflow-hidden rounded-[0.5rem] p-5 md:p-10"
      prefetch={false}
    >
      <div className="absolute inset-0 overflow-hidden bg-linear-to-r from-[#00CCFE] to-[#A6EDFF]">
        <picture
          className={cn(
            'absolute top-0 right-0 z-10 flex h-[45%] w-fit sm:h-[70%]',
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
      <svg
        className="relative z-10 mb-2.5 h-[1.75rem] w-auto text-black"
        width="21"
        height="18"
        viewBox="0 0 21 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.65078 4.5C1.61342 4.5 0.772476 5.34094 0.772476 6.3783V16.1217C0.772476 17.1591 1.61342 18 2.65078 18H18.7537C19.7911 18 20.632 17.1591 20.632 16.1217V6.3783C20.632 5.34094 19.7911 4.5 18.7537 4.5H2.65078ZM8.92175 6.75C8.66242 6.75 8.45218 6.96024 8.45218 7.21958V8.53043C8.45218 8.78976 8.66242 9 8.92175 9H12.4826C12.7419 9 12.9522 8.78976 12.9522 8.53043V7.21958C12.9522 6.96024 12.7419 6.75 12.4826 6.75H8.92175Z"
          fill="black"
        />
        <path
          opacity="0.3"
          d="M8.45218 4.5H6.20218V3.375C6.20218 1.51104 7.71322 0 9.57718 0H11.8272C13.6911 0 15.2022 1.51104 15.2022 3.375V4.5H12.9522V3.375C12.9522 2.75368 12.4485 2.25 11.8272 2.25H9.57718C8.95586 2.25 8.45218 2.75368 8.45218 3.375V4.5Z"
          fill="black"
        />
      </svg>
      <p className="relative z-10 text-2xl leading-[120%] font-bold text-black md:text-[28px]">
        Become a Sponsor
      </p>
      <p className="relative z-10 mt-1 max-w-[18rem] text-sm leading-[130%] text-black sm:max-w-md md:mt-1 md:max-w-[20rem] md:text-lg lg:max-w-sm xl:max-w-[25rem]">
        Reach{' '}
        {roundToNearestTenThousand(totalUsers || 0, true)?.toLocaleString(
          'en-us',
        ) || '0'}
        + top-tier talent in under 5 clicks. Get high-quality work done across
        content, development, and design.
      </p>
      <div className="relative z-10 mt-auto flex w-full flex-col items-center gap-3 pt-4 md:flex-row md:gap-4">
        <button
          className="ph-no-capture w-full rounded-md bg-black px-9 py-3 text-sm font-semibold text-white hover:bg-black/80 hover:text-white md:w-auto"
          onClick={() => {
            posthog.capture('sponsor_banner');
          }}
        >
          Get Started
        </button>
        <div className="flex w-fit items-center">
          {data?.totalSponsors !== null && (
            <p className="relative ml-[0.6875rem] text-[0.8rem] text-black md:text-[0.875rem]">
              Join{' '}
              {roundToNearestTenth(data?.totalSponsors || 0)?.toLocaleString(
                'en-us',
              )}
              + others
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
