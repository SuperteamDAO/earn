import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { statsDataQuery } from '@/queries/hackathon';
import { CypherpunkLogo } from '@/svg/cypherpunk-logo';
import { dayjs } from '@/utils/dayjs';
import { roundToNearestTenThousand } from '@/utils/number';

const base = `/hackathon/cypherpunk/`;
const baseAsset = (filename: string) => base + filename;

interface SidebarPosterProps {
  className?: string;
}

export function SidebarBannerCypherpunk({ className }: SidebarPosterProps) {
  const { data: stats } = useQuery(statsDataQuery('cypherpunk'));
  const CLOSE_DATE = stats?.deadline;
  return (
    <Link href="/hackathon/cypherpunk">
      <div
        className={`relative flex h-fit w-full flex-col items-center overflow-hidden rounded-lg border border-white/20 bg-[#F8F5FF] ${className}`}
      >
        <ExternalImage
          src={baseAsset('home-banner-square')}
          alt="Cypherpunk Hackathon"
          className="absolute top-0 left-0 w-full object-contain"
        />

        <div className="relative z-10 flex h-full w-full flex-col px-8 pt-36 pb-6 text-black">
          <div className="flex items-center justify-between">
            <CypherpunkLogo className="w-full" />
          </div>
          <p className="relative z-10 mt-2 text-xl leading-[120%] font-semibold text-black">
            Are you a dev? We have prizes worth $
            {roundToNearestTenThousand(
              stats?.totalRewardAmount ?? 0,
              true,
            )?.toLocaleString('en-us') || '0'}
            + for you
          </p>
          <p className="relative z-10 mt-3 text-sm leading-[130%] text-black/80 md:text-base">
            Submit to any of the Cypherpunk side tracks on Earn and stand to win
            from $
            {roundToNearestTenThousand(
              stats?.totalRewardAmount ?? 0,
              true,
            )?.toLocaleString('en-us') || '0'}
            +. Deadline for submissions is{' '}
            {dayjs(CLOSE_DATE)
              .utc()
              .add(1, 'minute')
              .format('MMM D (h:mmA [UTC])')}
          </p>

          <Button className={`mt-4 text-base`}>View Tracks</Button>
        </div>
      </div>
    </Link>
  );
}
