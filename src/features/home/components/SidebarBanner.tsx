import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { statsDataQuery } from '@/queries/hackathon';
import { dayjs } from '@/utils/dayjs';
import { roundToNearestTenThousand } from '@/utils/number';

interface SidebarPosterProps {
  className?: string;
}

export function SidebarBanner({ className }: SidebarPosterProps) {
  const { data: stats } = useQuery(statsDataQuery('frontier'));
  const CLOSE_DATE = stats?.deadline;
  return (
    <Link href="/earn/hackathon/frontier">
      <div
        className={`bg-brand-purple/5 border-brand-purple/4 relative flex h-fit w-full flex-col items-center overflow-hidden rounded-lg border ${className}`}
      >
        <ExternalImage
          src={'/hackathon/frontier/sidebar-banner'}
          alt="Frontier Hackathon"
          className="top-0 left-0 w-full object-contain"
        />

        <div className="relative z-10 flex h-full w-full flex-col px-4 pt-2 pb-5 text-black">
          <p className="relative z-10 mt-2 text-lg leading-[120%] font-semibold text-slate-800">
            Are you a dev? We have prizes worth $
            {roundToNearestTenThousand(
              stats?.totalRewardAmount ?? 0,
              true,
            )?.toLocaleString('en-us') || '0'}
            + for you
          </p>
          <p className="relative z-10 mt-3 text-sm leading-[130%] text-slate-600 md:text-base">
            Submit to any of the Frontier side tracks on Earn and stand to win
            from $
            {roundToNearestTenThousand(
              stats?.totalRewardAmount ?? 0,
              true,
            )?.toLocaleString('en-us') || '0'}
            +. Deadline for submissions is{' '}
            {dayjs(CLOSE_DATE).utc().add(1, 'minute').format('MMM D')}.
          </p>

          <Button className={`mt-4 text-base`}>View Tracks</Button>
        </div>
      </div>
    </Link>
  );
}
