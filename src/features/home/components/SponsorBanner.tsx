import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { MdArrowForward } from 'react-icons/md';

import { ExternalImage } from '@/components/ui/cloudinary-image';

import { userCountQuery } from '../queries/user-count';

export const SponsorBanner = () => {
  const posthog = usePostHog();
  const { data } = useQuery(userCountQuery);

  let number;
  if (data?.totalUsers) {
    if (data?.totalUsers > 10000) {
      number = Math.floor((data?.totalUsers || 0) / 10000) * 10000;
    } else if (data?.totalUsers > 1000) {
      number = Math.floor((data?.totalUsers || 0) / 1000) * 1000;
    } else {
      number = data?.totalUsers;
    }
  } else {
    number = 0;
  }

  return (
    <Link
      href="/sponsor"
      className="ph-no-capture group flex w-full justify-between gap-4 rounded-lg bg-slate-50 p-4"
      onClick={() => posthog?.capture('become a sponsor_banner')}
    >
      <div>
        <p className="flex items-center font-semibold text-slate-600 group-hover:underline">
          Become a Sponsor
          <MdArrowForward className="ml-1 w-6 text-[#777777]" />
        </p>
        <p className="mt-1 text-sm font-medium leading-[1.1rem] text-slate-500">
          Reach {number?.toLocaleString('en-us')}+ tech talent from one single
          dashboard
        </p>
      </div>
      <ExternalImage
        alt="Sponsor Briefcase"
        src={'/home/display/briefcase.webp'}
        className="mr-4 w-16 flex-1 object-contain"
      />
    </Link>
  );
};
