import posthog from 'posthog-js';

import { ExternalImage } from '@/components/ui/cloudinary-image';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

interface HomeTalentBannerProps {
  readonly totalUsers?: number | null;
}

const avatars = [
  { name: 'Abhishek', src: '/pfps/t1.webp' },
  { name: 'Pratik', src: '/pfps/md2.webp' },
  { name: 'Yash', src: '/pfps/fff1.webp' },
];

export function HomeTalentBanner({ totalUsers }: HomeTalentBannerProps) {
  return (
    <AuthWrapper
      className="relative mx-auto flex h-full w-full flex-col overflow-hidden rounded-[0.5rem] p-5 md:p-10"
      onClick={() => {
        posthog.capture('signup_banner');
      }}
    >
      <div className="absolute inset-0 h-full overflow-hidden">
        <picture>
          <source
            media="(min-width: 40em)"
            srcSet="/assets/banner/banner.avif"
            type="image/avif"
          />
          <source
            media="(min-width: 40em)"
            srcSet="/assets/banner/banner.webp"
            type="image/webp"
          />
          <source
            srcSet="/assets/banner/banner-mobile.avif"
            type="image/avif"
          />
          <source
            srcSet="/assets/banner/banner-mobile.webp"
            type="image/webp"
          />
          <img
            src="/assets/banner/banner-mobile.webp"
            alt="Illustration — Two people working on laptops outdoors at night, surrounded by a mystical mountainous landscape illuminated by the moonlight"
            className="h-full w-full"
            style={{ objectFit: 'cover' }}
            loading="eager"
            fetchPriority="high"
          />
        </picture>
      </div>
      <div
        className="absolute inset-0 bg-black/30 md:bg-black/20"
        aria-hidden="true"
      />
      <h1 className="relative z-10 text-2xl leading-[120%] font-bold text-white md:text-[28px]">
        Find High-Paying Crypto Bounties
        <br /> &amp; Web3 Freelance Jobs
      </h1>
      <p className="relative z-10 mt-2.5 max-w-full text-sm leading-[130%] text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/1)] md:mt-4 md:max-w-[30rem] md:text-lg">
        Discover crypto bounties and remote Web3 freelance opportunities from
        world-class teams, all with a single profile.
      </p>
      <div className="relative z-10 mt-auto flex flex-col items-center gap-3 pt-4 md:flex-row md:gap-4">
        <button className="ph-no-capture hover:bg-brand-purple w-full rounded-md bg-white px-9 py-3 text-sm font-medium text-[#3223A0] hover:text-white md:w-auto">
          Sign Up
        </button>
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {avatars.map((avatar, index) => (
              <ExternalImage
                key={index}
                className="relative h-6 w-6 rounded-full border border-[#49139c] md:h-8 md:w-8"
                src={avatar.src}
                alt={avatar.name}
                loading="eager"
              />
            ))}
          </div>
          {totalUsers !== null && totalUsers !== undefined && (
            <p className="relative ml-[0.6875rem] text-[0.8rem] text-slate-200 md:text-[0.875rem]">
              Join {totalUsers?.toLocaleString('en-us')}+ others
            </p>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
}
