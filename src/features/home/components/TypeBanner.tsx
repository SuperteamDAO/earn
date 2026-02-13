import Image from 'next/image';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useUser } from '@/store/user';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

type TypeTypes = 'bounties' | 'projects';

type TypeBanner = {
  img: string;
  heading: string;
  description: string;
};

const banners: Record<TypeTypes, TypeBanner> = {
  bounties: {
    img: ASSET_URL + '/banner/banner',
    heading: 'Crypto Bounties & Web3 Freelance Opportunities',
    description:
      'Complete short-term crypto bounties from top Solana teams and get rewarded for real work. From development and design to content creation, ship fast, build your portfolio, and earn in USDC, SOL, and other tokens.',
  },
  projects: {
    img: ASSET_URL + '/banner/banner',
    heading: 'Remote Crypto Jobs & Web3 Freelance Projects',
    description:
      'Explore long-term web3 freelance work with top Solana teams. Apply to remote crypto jobs across development, design, operations, and content, and get paid in USDC, SOL, and other tokens while contributing meaningful work with real teams.',
  },
};

export function TypeBanner({ type }: { type: TypeTypes }) {
  const banner = banners[type];
  const { user } = useUser();

  return (
    <div className="relative flex h-52 w-full flex-col items-center md:h-72">
      <Image
        src={banner.img}
        alt={type}
        width={1440}
        height={290}
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute top-1/2 flex w-full max-w-7xl -translate-y-1/2 flex-col items-start px-2 lg:px-6 xl:px-0">
        {banner.heading && (
          <h1 className="text-2xl font-semibold text-white md:text-4xl">
            {banner.heading}
          </h1>
        )}
        {banner.description && (
          <p className="mt-3 max-w-2xl text-sm text-white md:text-lg">
            {banner.description}
          </p>
        )}
        {!user && (
          <AuthWrapper className="w-full sm:w-auto">
            <Button
              className="ph-no-capture mt-5 h-9 w-full bg-white px-9 py-1 text-sm text-[#3223A0] sm:w-auto md:h-10 md:py-3"
              onClick={() => {
                posthog.capture('signup_type banner', { type });
              }}
            >
              Sign Up
            </Button>
          </AuthWrapper>
        )}
      </div>
    </div>
  );
}
