import { useQuery } from '@tanstack/react-query';
import { getImageProps } from 'next/image';
import { usePostHog } from 'posthog-js/react';
import React from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import DesktopBanner from '@/public/assets/banner.webp';
import MobileBanner from '@/public/assets/banner-mobile.webp';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

import { userCountQuery } from '../../queries/user-count';

const avatars = [
  { name: 'Abhishek', src: ASSET_URL + '/pfps/t1.webp' },
  { name: 'Pratik', src: ASSET_URL + '/pfps/md2.webp' },
  { name: 'Yash', src: ASSET_URL + '/pfps/fff1.webp' },
];

export function HomeTalentBanner() {
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
    <div className="relative mx-auto flex h-full w-full flex-col overflow-hidden rounded-[0.5rem] p-5 md:p-10">
      <div className="absolute inset-0 h-full overflow-hidden">
        <picture>
          <source media="(min-width: 40em)" srcSet={desktop} />
          <source media="(max-width: 40em)" srcSet={mobile} />
          <img {...rest} className="h-full w-full" alt={rest.alt} />
        </picture>
      </div>
      <div
        className="absolute inset-0 bg-black/30 md:bg-black/20"
        aria-hidden="true"
      />
      <p className="relative z-10 text-2xl leading-[120%] font-bold text-white md:text-[28px]">
        Find Your Next High
        <br /> Paying Crypto Gig
      </p>
      <p className="relative z-10 mt-2.5 max-w-full text-sm leading-[130%] text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/1)] md:mt-4 md:max-w-[30rem] md:text-lg">
        Participate in bounties or apply to freelance gigs of world-class crypto
        companies, all with a single profile.
      </p>
      <div className="relative z-10 mt-auto flex flex-col items-center gap-3 pt-4 md:flex-row md:gap-4">
        <AuthWrapper className="group w-full md:w-auto">
          <button
            className="ph-no-capture hover:bg-brand-purple w-full rounded-md bg-white px-9 py-3 text-sm font-medium text-[#3223A0] hover:text-white md:w-auto"
            onClick={() => {
              posthog.capture('signup_banner');
            }}
          >
            Sign Up
          </button>
        </AuthWrapper>
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {avatars.map((avatar, index) => (
              <img
                key={index}
                className="relative h-6 w-6 rounded-full border border-[#49139c] md:h-8 md:w-8"
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
