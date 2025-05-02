import { useQuery } from '@tanstack/react-query';
import { getImageProps } from 'next/image';
import { usePostHog } from 'posthog-js/react';
import React from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import DesktopBanner from '@/public/assets/banner.webp';
import MobileBanner from '@/public/assets/banner-mobile.webp';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

import { userCountQuery } from '../queries/user-count';

const avatars = [
  { name: 'Artur', src: ASSET_URL + '/pfps/artur.webp' },
  { name: 'Keith', src: ASSET_URL + '/pfps/keith.webp' },
  { name: 'Mike', src: ASSET_URL + '/pfps/mike.webp' },
];

export function HomeBanner() {
  const posthog = usePostHog();
  const common = {
    alt: 'Illustration — Two people working on laptops outdoors at night, surrounded by a mystical mountainous landscape illuminated by the moonlight',
    quality: 85,
    priority: true,
    loading: 'eager' as const,
    style: {
      width: '100%',
      maxWidth: '100%',
      borderRadius: '0.375rem',
      pointerEvents: 'none' as const,
      objectFit: 'cover' as const,
      layout: 'fill' as const,
    },
  };

  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: DesktopBanner, sizes: '70vw' });

  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...common, src: MobileBanner, sizes: '100vw' });

  const { data } = useQuery(userCountQuery);

  return (
    <div className="relative mx-auto my-3 h-[260px] max-h-[500px] w-full rounded-md p-5 md:h-[280px] md:p-10">
      <div className="absolute inset-0 overflow-hidden">
        <picture>
          <source media="(min-width: 40em)" srcSet={desktop} />
          <source media="(max-width: 40em)" srcSet={mobile} />
          <img {...rest} className="h-full w-full" alt={common.alt} />
        </picture>
      </div>
      <p className="relative z-10 text-2xl font-bold leading-[120%] text-white md:text-[28px]">
        Find Your Next High-Impact
        <br /> Professional Role
      </p>
      <p className="relative z-10 mt-2.5 max-w-full text-sm leading-[130%] text-white md:mt-4 md:max-w-[30rem] md:text-lg">
        Participate in bounties or apply to freelance opportunities from leading
        companies.
      </p>
      <div className="relative z-10 mt-4 flex flex-col items-center gap-3 md:flex-row md:gap-4">
        <AuthWrapper className="group w-full md:w-auto">
          <button
            className="ph-no-capture w-full rounded-md bg-white px-9 py-3 text-sm font-medium text-black hover:bg-brand-green hover:text-white md:w-auto"
            onClick={() => {
              posthog.capture('signup_banner');
            }}
          >
            Sign Up
          </button>
        </AuthWrapper>
        <div className="flex items-center">
          <div className="flex -space-x-4">
            {avatars.map((avatar, index) => (
              <img
                key={index}
                className="relative h-8 w-8 rounded-full md:h-10 md:w-10"
                src={avatar.src}
                alt={avatar.name}
              />
            ))}
          </div>
          {data?.totalUsers !== null && (
            <p className="relative ml-[0.6875rem] text-[0.8rem] text-slate-200 md:text-[0.875rem]">
              Join {data?.totalUsers?.toLocaleString('en-us')}+ others
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
