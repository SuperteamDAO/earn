import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import Image from 'next/image';
import { type ReactNode, useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { statsDataQuery, type Stats } from '@/queries/hackathon';
import { PulseIcon } from '@/svg/pulse-icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

type HackathonStatus = 'Start In' | 'Close In' | 'Closed';
type StatsState = 'loading' | 'unavailable' | 'ready';

const NEXT_STOP_BREAKPOINT_SLUG = 'next-stop-breakpoint';
const FALLBACK_START_DATE = '2026-09-23T00:00:00.000Z';
const FALLBACK_CLOSE_DATE = '2026-10-13T00:00:00.000Z';

const HACKATHON_DESCRIPTION =
  'Submit to bounties for a chance to win Breakpoint tickets.';
const BACKGROUND_IMAGE =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1789989342/assets/hackathon/next-stop-breakpoint/road-to-bp.png';
const SUMMARY_BACKGROUND_IMAGE =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1789989339/assets/hackathon/next-stop-breakpoint/big-ben.png';
const OG_IMAGE =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1789989342/assets/hackathon/next-stop-breakpoint/road-to-bp.png';
const HERO_LOGO =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1789989266/assets/hackathon/next-stop-breakpoint/bp-logo.png';

export default function CryptoWorldFair({
  startDate,
  closeDate,
}: {
  startDate: string;
  closeDate: string;
}) {
  const {
    data: stats,
    isError,
    isLoading,
  } = useQuery(statsDataQuery(NEXT_STOP_BREAKPOINT_SLUG));
  const statsState: StatsState = isLoading
    ? 'loading'
    : isError || !stats
      ? 'unavailable'
      : 'ready';

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Next Stop Breakpoint | Superteam Earn"
          description={HACKATHON_DESCRIPTION}
          canonical="https://superteam.fun/earn/next-stop-breakpoint/"
          og={OG_IMAGE}
        />
      }
    >
      <Hero
        stats={stats}
        statsState={statsState}
        startDate={startDate}
        closeDate={closeDate}
        description={HACKATHON_DESCRIPTION}
      />
      <div className="mx-auto mt-14 mb-20 w-full max-w-7xl px-4 md:mt-14 xl:mt-16">
        <Tracks />
        <p className="mx-auto mt-2 max-w-3xl text-center text-base text-slate-500">
          Note: The prize amount shown is for listing purposes only. Winners
          will receive a Breakpoint ticket instead of the stated cash prize.
        </p>
      </div>
    </Default>
  );
}

function Hero({
  stats,
  statsState,
  startDate,
  closeDate,
  description,
}: {
  stats: Pick<Stats, 'totalRewardAmount' | 'totalListings'> | undefined;
  statsState: StatsState;
  startDate: string | Date;
  closeDate: string | Date;
  description: string;
}) {
  return (
    <section
      className="relative flex w-full flex-col items-center border-b border-slate-200 bg-[#FFF1CE] bg-cover bg-center bg-no-repeat pt-14 pb-25 text-center text-white"
      style={{
        backgroundImage: `url('${BACKGROUND_IMAGE}')`,
      }}
    >
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <div className="relative w-full max-w-[18rem] sm:max-w-[24rem] md:max-w-[32rem]">
        <p
          className="mb-4 w-full text-center text-xs font-black tracking-[2em] text-white uppercase sm:text-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Next Stop
        </p>
        <Image
          src={HERO_LOGO}
          alt="Next Stop Breakpoint"
          width={1120}
          height={320}
          priority
          className="h-auto w-full"
        />
      </div>
      <div className="relative mt-4 mb-1 flex w-full max-w-[42rem] flex-col items-center gap-4 px-4 text-white">
        <p className="text-sm sm:text-base">{description}</p>
        <Button
          variant="outline"
          className="mx-auto min-h-10 w-fit gap-3 rounded-[0.5rem] border-white/40 bg-black/20 px-8 text-base text-white hover:bg-black/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/35"
          onClick={() => {
            const tracksSection = document.getElementById('tracks-section');
            if (tracksSection) {
              const elementPosition = tracksSection.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - 60;

              window.scrollTo({
                top: offsetPosition,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                  .matches
                  ? 'auto'
                  : 'smooth',
              });
            }
          }}
        >
          <PulseIcon
            isPulsing={false}
            w={8}
            h={8}
            bg="#ff9305"
            text="#ff9305"
          />
          Submissions Open Soon
        </Button>
      </div>
      <div className="absolute bottom-[-16%] mt-0 flex w-full max-w-[90%] flex-row overflow-hidden rounded-2xl border-[1.14px] border-white/50 md:w-fit">
        <HeroMini
          stats={stats}
          statsState={statsState}
          startDate={startDate}
          closeDate={closeDate}
        />
      </div>
    </section>
  );
}

function HeroMini({
  startDate,
  closeDate,
  stats,
  statsState,
}: {
  startDate: string | Date;
  closeDate: string | Date;
  stats: Pick<Stats, 'totalRewardAmount' | 'totalListings'> | undefined;
  statsState: StatsState;
}) {
  const isMd = useBreakpoint('md');
  const [isMounted, setIsMounted] = useState(false);
  const [countdownDate, setCountdownDate] = useState<Date>(
    dayjs.utc(startDate).toDate(),
  );
  const [status, setStatus] = useState<HackathonStatus>('Start In');

  useEffect(() => {
    setIsMounted(true);

    function updateStatus() {
      if (dayjs().isAfter(dayjs(closeDate))) {
        setStatus('Closed');
      } else if (dayjs().isAfter(dayjs(startDate))) {
        setCountdownDate(dayjs.utc(closeDate).toDate());
        setStatus('Close In');
      }
    }

    updateStatus();

    const intervalId = window.setInterval(updateStatus, 1000);

    return () => window.clearInterval(intervalId);
  }, [startDate, closeDate]);

  return (
    <div
      className="relative flex w-full items-center justify-center gap-0 overflow-hidden rounded-md bg-cover bg-center bg-no-repeat px-1 py-6 text-black sm:gap-8 sm:px-6 md:flex-row md:gap-12 md:rounded-xl md:px-16"
      style={{
        backgroundImage: `url('${SUMMARY_BACKGROUND_IMAGE}')`,
        backgroundPosition: 'center bottom',
      }}
    >
      <div className="absolute inset-0 bg-black/25" aria-hidden="true" />
      <MiniStat
        className="w-[9rem]"
        title={isMd ? `Submissions ${status}` : mobileTitleForCountdown(status)}
      >
        {isMounted && status !== 'Closed' ? (
          <Countdown
            date={countdownDate}
            renderer={CountDownRenderer}
            zeroPadDays={1}
          />
        ) : (
          '-'
        )}
      </MiniStat>
      <MiniStat className="w-[5rem] sm:w-[7rem]" title="Total Prizes">
        {statsState === 'loading' && 'Loading'}
        {statsState === 'unavailable' && 'Unavailable'}
        {statsState === 'ready' &&
          stats &&
          `$${stats.totalRewardAmount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
      </MiniStat>

      <MiniStat className="w-[5rem] sm:w-[7rem]" title="Bounties">
        {statsState === 'loading' && 'Loading'}
        {statsState === 'unavailable' && 'Unavailable'}
        {statsState === 'ready' && stats && stats.totalListings}
      </MiniStat>
    </div>
  );
}

function mobileTitleForCountdown(status: HackathonStatus) {
  if (status === 'Start In') return 'Starts In';
  if (status === 'Close In') return 'Closes In';
  return status;
}

function MiniStat({
  title,
  children,
  className,
  infotipContent,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  infotipContent?: string;
}) {
  return (
    <Tooltip
      content={infotipContent}
      contentProps={{
        className: 'w-3/4 md:w-auto',
      }}
      disabled={!infotipContent}
    >
      <div
        className={cn(
          'relative z-10 flex flex-col items-start gap-1 md:items-start',
          className,
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-left text-xs whitespace-nowrap text-white md:w-max md:text-sm">
            {title}
          </span>
          {infotipContent && (
            <Info className="h-3 w-3 text-gray-400" aria-hidden="true" />
          )}
        </span>
        <span
          className="text-lg font-bold text-white tabular-nums md:text-2xl"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {children}
        </span>
      </div>
    </Tooltip>
  );
}

function Tracks() {
  return (
    <section id="tracks-section" className="sm:mx-6">
      <div className="max-w-7xl py-6 sm:mx-auto">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-700">
          Bounties are coming soon.
        </div>
      </div>
    </section>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const hackathon = await prisma.hackathon.findUnique({
    where: { slug: NEXT_STOP_BREAKPOINT_SLUG },
  });

  return {
    props: {
      startDate: hackathon?.startDate?.toISOString() ?? FALLBACK_START_DATE,
      closeDate: hackathon?.deadline?.toISOString() ?? FALLBACK_CLOSE_DATE,
    },
  };
};
