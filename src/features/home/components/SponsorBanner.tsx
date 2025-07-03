import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import posthog from 'posthog-js';

import MdArrowForward from '@/components/icons/MdArrowForward';
import { ExternalImage } from '@/components/ui/cloudinary-image';

import { userCountQuery } from '../queries/user-count';

export const SponsorBanner = () => {
  const { data } = useQuery(userCountQuery);

  return (
    <Link
      href="/sponsor"
      className="ph-no-capture group flex w-full justify-between gap-4 rounded-lg bg-indigo-50 p-4"
      onClick={() => posthog?.capture('become a sponsor_banner')}
      prefetch={false}
    >
      <div>
        <p className="flex items-center font-semibold text-slate-600 group-hover:underline">
          Become a Sponsor
          <MdArrowForward className="ml-1 w-6 text-[#777777]" />
        </p>
        <p className="mt-1 text-sm leading-[1.1rem] font-medium text-slate-500">
          Reach{' '}
          {(Math.floor((data?.totalUsers || 0) / 10000) * 10000).toLocaleString(
            'en-us',
          )}
          + crypto talent from one single dashboard
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
