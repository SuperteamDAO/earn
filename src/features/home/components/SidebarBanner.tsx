import { useQuery } from '@tanstack/react-query';
import localFont from 'next/font/local';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { hackathonQuery } from '@/queries/hackathon';
import { dayjs } from '@/utils/dayjs';

const sportyPro = localFont({
  src: [
    {
      path: '../../../theme/SportyPro-Light.woff',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../../theme/SportyPro-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../../theme/SportyPro-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../theme/SportyPro-Regular.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
});

const base = `/hackathon/seoulana/`;
const baseAsset = (filename: string) => base + filename;

interface SidebarPosterProps {
  className?: string;
}

export function SidebarBanner({ className }: SidebarPosterProps) {
  const { data: hackathon } = useQuery(hackathonQuery('seoulana'));
  const START_DATE = hackathon?.startDate;
  const CLOSE_DATE = hackathon?.deadline;
  return (
    <Link href="#">
      <div
        className={`relative flex h-[21.125rem] w-full flex-col items-center overflow-hidden rounded-xl border border-white/20 ${className}`}
      >
        <ExternalImage
          src={baseAsset('sidebar-bg')}
          alt="Seoulana Hackathon"
          className="absolute top-0 left-0 h-full w-full object-cover"
        />

        <div className="relative z-10 flex h-full w-full flex-col px-4 py-6 text-white">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <ExternalImage
              alt="Seoulana"
              src={baseAsset('logo')}
              className="ml-4 w-38"
            />

            <span
              className={`${sportyPro.className} flex flex-col items-end text-center !leading-5 font-light`}
            >
              <p>2025</p>
              <p className={``}>
                {dayjs(START_DATE).format('M.DD')} -{' '}
                {dayjs(CLOSE_DATE).format('M.DD')}
              </p>
            </span>
          </div>
          <div className="my-auto flex flex-col items-center pt-4 font-light">
            <p className={`${sportyPro.className} text-2xl text-white`}>
              PRIZE POOL
            </p>
            <p
              className={`${sportyPro.className} bg-gradient-to-br from-white via-[#B251FF] via-[68%] to-[#E6C6FF] bg-clip-text pt-2 text-6xl text-transparent`}
            >
              $97,000
            </p>
            <p className={`${sportyPro.className} text-[#AFAFAF]`}>
              TOTAL PRIZES
            </p>
          </div>

          <Button
            variant="secondary"
            className={`${sportyPro.className} mt-auto w-full rounded-md bg-[#A737FF] text-base font-medium text-white hover:bg-[#A737FF]/70`}
          >
            SUBMIT NOW
          </Button>
        </div>
      </div>
    </Link>
  );
}
