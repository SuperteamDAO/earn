import { useQuery } from '@tanstack/react-query';
import localFont from 'next/font/local';
import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';
import Countdown, { type CountdownRenderProps } from 'react-countdown';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { statsDataQuery } from '@/queries/hackathon';
import { dayjs } from '@/utils/dayjs';
import { roundToNearestTenThousand } from '@/utils/number';

interface SidebarPosterProps {
  className?: string;
}

const digital7Italic = localFont({
  src: '../../../../public/fonts/digital-7-italic.ttf',
  display: 'swap',
});

export function SidebarBanner({ className }: SidebarPosterProps) {
  const { data: stats } = useQuery(statsDataQuery('world-cup'));
  const CLOSE_DATE = stats?.deadline;
  return (
    <Link href="/earn/hackathon/world-cup" className="mt-5 block">
      <div
        className={`bg-brand-purple/5 border-brand-purple/4 relative flex h-fit w-full flex-col items-center rounded-lg border p-2 ${className}`}
      >
        <SidebarDigitalTimer deadline={CLOSE_DATE} />

        <div className="w-full overflow-hidden rounded-md">
          <ExternalImage
            src={'/hackathon/world-cup/sidebar-banner'}
            alt="World Cup Hackathon"
            className="top-0 left-0 w-full object-contain"
          />
        </div>

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
            Submit to any of the World Cup tracks on Earn and stand to win from
            $
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

function SidebarDigitalTimer({ deadline }: { deadline?: string | Date }) {
  const [isCountdownReady, setIsCountdownReady] = useState(false);

  useEffect(() => {
    setIsCountdownReady(true);
  }, []);

  if (!deadline) return null;

  return (
    <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
      {isCountdownReady ? (
        <Countdown
          date={dayjs.utc(deadline).toDate()}
          renderer={SidebarTimerRenderer}
          zeroPadTime={2}
          zeroPadDays={2}
        />
      ) : (
        <SidebarTimerShell>
          <SidebarTimerUnit value="00" unit="D" />
          <SidebarTimerSeparator />
          <SidebarTimerUnit value="00" unit="H" />
          <SidebarTimerSeparator />
          <SidebarTimerUnit value="00" unit="M" />
          <SidebarTimerSeparator />
          <SidebarTimerUnit value="00" unit="S" />
          <span className="ml-4">LEFT</span>
        </SidebarTimerShell>
      )}
    </div>
  );
}

function SidebarTimerRenderer({
  days,
  hours,
  minutes,
  seconds,
  completed,
}: CountdownRenderProps) {
  if (completed) {
    return <SidebarTimerShell isReview>In Review</SidebarTimerShell>;
  }

  return (
    <SidebarTimerShell>
      <SidebarTimerUnit value={days} unit="D" />
      <SidebarTimerSeparator />
      <SidebarTimerUnit value={padTimeUnit(hours)} unit="H" />
      <SidebarTimerSeparator />
      <SidebarTimerUnit value={padTimeUnit(minutes)} unit="M" />
      <SidebarTimerSeparator />
      <SidebarTimerUnit value={padTimeUnit(seconds)} unit="S" />
      <span className="ml-4">LEFT</span>
    </SidebarTimerShell>
  );
}

function SidebarTimerShell({
  children,
  isReview = false,
}: {
  children: ReactNode;
  isReview?: boolean;
}) {
  return (
    <div
      className={`${digital7Italic.className} border-2 border-[#B7B7AB] bg-[#101010] px-3 py-3 text-[1.5rem] leading-none tracking-normal whitespace-nowrap uppercase shadow-[0_8px_12px_rgba(15,23,42,0.35),inset_0_0_14px_rgba(0,0,0,0.5),inset_0_1px_10px_rgba(255,255,255,0.5)] [&_.timer-unit]:text-[0.58em] ${
        isReview ? 'text-[#FDFFA4]' : 'text-[#FF0404]'
      }`}
      style={{
        fontStyle: 'italic',
        WebkitTextStroke: '0.5px #510000',
        textShadow: '0 0 6px rgba(255, 29, 23, 0.8)',
      }}
    >
      {children}
    </div>
  );
}

function SidebarTimerUnit({
  value,
  unit,
}: {
  value: string | number;
  unit: string;
}) {
  return (
    <span className="inline-flex items-baseline">
      {value}
      <span className="timer-unit">{unit}</span>
    </span>
  );
}

function SidebarTimerSeparator() {
  return <span className="mx-[5px]">:</span>;
}

function padTimeUnit(value: number) {
  return value.toString().padStart(2, '0');
}
