import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { MdArrowForward } from 'react-icons/md';

import Briefcase from '@/public/assets/home/display/briefcase.webp';

import { userCountQuery } from '../queries';

export const SponsorBanner = () => {
  const posthog = usePostHog();
  const { data } = useQuery(userCountQuery);

  return (
    <NextLink
      href="/sponsor"
      className="ph-no-capture group flex w-full justify-between gap-4 rounded-lg bg-purple-50 p-4"
      onClick={() => posthog?.capture('become a sponsor_banner')}
    >
      <div>
        <p className="flex items-center font-semibold text-slate-600 group-hover:underline">
          Become a Sponsor
          <MdArrowForward className="ml-1 w-6 text-[#777777]" />
        </p>
        <p className="mt-1 text-sm font-medium leading-[1.1rem] text-slate-500">
          Reach{' '}
          {(Math.floor((data?.totalUsers || 0) / 10000) * 10000).toLocaleString(
            'en-us',
          )}
          + crypto talent from one single dashboard
        </p>
      </div>
      <Image
        alt="Sponsor Briefcase"
        src={Briefcase}
        className="mr-4 w-16 flex-1 object-contain"
      />
    </NextLink>
  );
};
