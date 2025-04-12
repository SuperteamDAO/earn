import { useQuery } from '@tanstack/react-query';
import localFont from 'next/font/local';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { hackathonQuery } from '@/queries/hackathon';
import { BreakoutLogo } from '@/svg/breakout-logo';
import { dayjs } from '@/utils/dayjs';

const animeAce = localFont({
  src: [
    {
      path: '../../../theme/animeace2_reg.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../theme/animeace2_reg.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../theme/animeace2_ital.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../../theme/animeace2_ital.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../../theme/animeace2_bld.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../../theme/animeace2_bld.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
});

const base = `/hackathon/breakout/`;
const baseAsset = (filename: string) => base + filename;

interface SidebarPosterProps {
  className?: string;
}

export function SidebarBannerBreakout({ className }: SidebarPosterProps) {
  const slug = 'breakout';
  // const { data: stats } = useQuery(statsDataQuery(slug));
  const { data: hackathon } = useQuery(hackathonQuery(slug));
  const CLOSE_DATE = new Date(hackathon?.deadline || '');
  return (
    <Link href="/hackathon/breakout">
      <div
        className={`relative flex h-[21.125rem] w-full flex-col items-center overflow-hidden rounded-xl border border-white/20 ${className}`}
      >
        <ExternalImage
          src={baseAsset('sidebar-bg')}
          alt="Breakout Hackathon"
          className="absolute top-0 left-0 h-full w-full object-cover"
        />

        <div className="relative z-10 flex h-full w-full flex-col px-4 pt-6 pb-4 text-black">
          <div className="flex items-center justify-between px-4">
            <BreakoutLogo className="h-[10.8125rem]" />
          </div>
          <div
            className={`${animeAce.className} flex flex-col items-center justify-center`}
          >
            <p className="text-xs italic">
              Submissions Due {dayjs(CLOSE_DATE).format('MMM DD, YYYY')}
            </p>
            <p className="pt-1 text-lg font-bold">
              $150K+ in side tracks
              {/* ${stats?.totalRewardAmount.toLocaleString('en-us') ?? '-'} in side */}
            </p>
          </div>

          <Button
            variant="secondary"
            className={`${animeAce.className} mt-auto mb-2 w-full rounded-md bg-black text-base font-bold text-white hover:bg-black/70`}
          >
            SUBMIT NOW
          </Button>
        </div>
      </div>
    </Link>
  );
}
