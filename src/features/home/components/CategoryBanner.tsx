import Image from 'next/image';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { PROJECT_NAME } from '@/constants/project';
import { useUser } from '@/store/user';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

const bannerPrefix = ASSET_URL + '/category_assets/banners/';

type CategoryTypes = 'content' | 'development' | 'design' | 'other';

type CategoryBanner = {
  type: CategoryTypes;
  img: string;
  heading: string;
  description: string;
};

const banners: CategoryBanner[] = [
  {
    type: 'content',
    img: bannerPrefix + 'Content.webp',
    heading: 'Find your next Content gig',
    description:
      'If you can write insightful essays, make stunning videos, or create killer memes, the opportunities below are calling your name.',
  },
  {
    type: 'development',
    img: bannerPrefix + 'Dev.webp',
    heading: 'Find your next Development gig',
    description: `If building robust applications and scalable solutions is your forte, don't miss out on the earning opportunities listed below.`,
  },
  {
    type: 'design',
    img: bannerPrefix + 'Design.webp',
    heading: 'Find your next Design gig',
    description:
      'If delighting users with eye-catching designs is your jam, you should check out the earning opportunities below.',
  },
  {
    type: 'other',
    img: bannerPrefix + 'Other.webp',
    heading: `Find your next gig on ${PROJECT_NAME}`,
    description:
      "If you have a unique skill set that doesn't fit into the other categories, you might find your next gig here.",
  },
];

export function CategoryBanner({ category }: { category: CategoryTypes }) {
  const [banner, setBanner] = useState<CategoryBanner | null>(null);
  const posthog = usePostHog();
  const { user } = useUser();

  useEffect(() => {
    setBanner(banners.find((b) => b.type === category) ?? null);
  }, [category]);

  if (!banner) return null;

  return (
    <div className="relative flex h-72 w-full flex-col items-center">
      <Image
        src={banner.img}
        alt={banner.type}
        width={1440}
        height={290}
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute top-1/2 flex w-full max-w-7xl -translate-y-1/2 flex-col items-start px-3 md:px-4">
        {banner.heading && (
          <h2 className="text-2xl font-bold text-white md:text-4xl">
            {banner.heading}
          </h2>
        )}
        {banner.description && (
          <p className="mt-3 max-w-[37rem] text-sm font-medium text-white md:text-lg">
            {banner.description}
          </p>
        )}
        {!user && (
          <AuthWrapper className="w-full sm:w-auto">
            <Button
              className="ph-no-capture my-2 w-full bg-white px-9 py-3 text-sm text-[#3223A0] sm:w-auto"
              onClick={() => {
                posthog.capture('signup_category banner');
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
