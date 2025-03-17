import { useQuery } from '@tanstack/react-query';
import { getImageProps } from 'next/image';
import { usePostHog } from 'posthog-js/react';
import React from 'react';

import SponsorLogosBanner from '@/public/assets/banner-sponsor-logos.webp';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

import { sponsorCountQuery } from '../../queries/sponsor-count';
import { userCountQuery } from '../../queries/user-count';

export function HomeSponsorBanner() {
  const posthog = usePostHog();
  const common = {
    alt: 'Illustration — Gradient Light blue with Logos of Solana first Companies',
    quality: 85,
    priority: true,
    loading: 'eager' as const,
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
  } = getImageProps({ ...common, src: SponsorLogosBanner, sizes: '20vw' });

  const { data } = useQuery(sponsorCountQuery);
  const { data: userCount } = useQuery(userCountQuery);
  return (
    <div className="relative mx-auto flex h-full w-full flex-col overflow-hidden rounded-md p-5 md:p-10">
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-r from-[#00CCFE] to-[#A6EDFF]">
        <picture className="relative ml-auto hidden h-full w-fit translate-y-6 scale-125 md:block lg:hidden xl:block">
          <source media="(min-width: 40em)" srcSet={desktop} />
          <img {...rest} className="h-full w-full" alt={rest.alt} />
        </picture>
      </div>
      <svg
        className="relative z-10 mb-2.5 h-[1.75rem] w-fit text-black"
        width="21"
        height="18"
        viewBox="0 0 21 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M2.65078 4.5C1.61342 4.5 0.772476 5.34094 0.772476 6.3783V16.1217C0.772476 17.1591 1.61342 18 2.65078 18H18.7537C19.7911 18 20.632 17.1591 20.632 16.1217V6.3783C20.632 5.34094 19.7911 4.5 18.7537 4.5H2.65078ZM8.92175 6.75C8.66242 6.75 8.45218 6.96024 8.45218 7.21958V8.53043C8.45218 8.78976 8.66242 9 8.92175 9H12.4826C12.7419 9 12.9522 8.78976 12.9522 8.53043V7.21958C12.9522 6.96024 12.7419 6.75 12.4826 6.75H8.92175Z"
          fill="black"
        />
        <path
          opacity="0.3"
          d="M8.45218 4.5H6.20218V3.375C6.20218 1.51104 7.71322 0 9.57718 0H11.8272C13.6911 0 15.2022 1.51104 15.2022 3.375V4.5H12.9522V3.375C12.9522 2.75368 12.4485 2.25 11.8272 2.25H9.57718C8.95586 2.25 8.45218 2.75368 8.45218 3.375V4.5Z"
          fill="black"
        />
      </svg>
      <p className="relative z-10 text-2xl font-bold leading-[120%] text-black md:text-[28px]">
        Become a Sponsor
      </p>
      <p className="relative z-10 mt-1 max-w-full text-sm leading-[130%] text-black md:mt-1 md:max-w-[30rem] md:text-lg lg:max-w-none xl:max-w-[30rem]">
        Reach {userCount?.totalUsers?.toLocaleString('en-us') || '0'}+ top-tier
        talent in under 5 clicks. Post your task in minutes and get high-quality
        results across content, development, and design.
      </p>
      <div className="relative z-10 mt-auto flex flex-col items-center gap-3 pt-4 md:flex-row md:gap-4">
        <AuthWrapper className="group w-full md:w-auto">
          <button
            className="ph-no-capture w-full rounded-md bg-black px-9 py-3 text-sm font-semibold text-white hover:bg-brand-purple hover:text-white md:w-auto"
            onClick={() => {
              posthog.capture('signup_banner');
            }}
          >
            Get Started
          </button>
        </AuthWrapper>
        <div className="flex items-center">
          {data?.totalSponsors !== null && (
            <p className="relative ml-[0.6875rem] text-[0.8rem] text-black md:text-[0.875rem]">
              Join {data?.totalSponsors?.toLocaleString('en-us')}+ others
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
