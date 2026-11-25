import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import localFont from 'next/font/local';
import { type ReactNode, useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { type TrackProps } from '@/interface/hackathon';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { domPurify } from '@/lib/domPurify';
import { prisma } from '@/prisma';
import { type HackathonGetPayload } from '@/prisma/models/Hackathon';
import {
  type Stats,
  statsDataQuery,
  trackDataQuery,
} from '@/queries/hackathon';
import { PulseIcon } from '@/svg/pulse-icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

type Hackathon = HackathonGetPayload<{
  include: {
    Sponsor: true;
  };
}>;

type HackathonStatus = 'Start In' | 'Close In' | 'Closed';

const SLUG = 'geckothon';
const OG_IMAGE =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/assets/hackathon/geckothon/og.png';

const archivoBold = localFont({
  src: '../../../../public/fonts/Archivo_SemiExpanded-Bold.ttf',
  display: 'swap',
});

// CoinGecko-inspired palette, reinterpreted as a dark "market terminal".
const GECKO_GREEN = '#8DC63F';
const FOREST = '#0B1D0D';

export default function Geckothon({ hackathon }: { hackathon: Hackathon }) {
  if (!hackathon.startDate || !hackathon.deadline) {
    throw new Error('Start Date and deadline missing');
  }

  const startDate = hackathon.startDate;
  const closeDate = hackathon.deadline;

  const {
    data: trackData,
    isPending: areTracksLoading,
    isError: didTracksFail,
    refetch: refetchTracks,
  } = useQuery(trackDataQuery(SLUG));
  const { data: stats } = useQuery(statsDataQuery(SLUG));

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Geckothon | Superteam Earn"
          description={hackathon.description}
          canonical="https://superteam.fun/earn/hackathon/geckothon/"
          og={OG_IMAGE}
        />
      }
    >
      <Hero
        stats={stats}
        startDate={startDate}
        closeDate={closeDate}
        description={hackathon.description}
      />
      <div className="mx-auto mt-20 mb-20 w-full max-w-7xl px-4 md:mt-24">
        <Tracks
          tracks={trackData}
          isLoading={areTracksLoading}
          isError={didTracksFail}
          onRetry={() => void refetchTracks()}
        />
        <FAQs />
      </div>
    </Default>
  );
}

function Hero({
  startDate,
  closeDate,
  stats,
  description,
}: {
  startDate: string | Date;
  closeDate: string | Date;
  stats: Stats | undefined;
  description: string;
}) {
  const [status, setStatus] = useState<HackathonStatus>('Start In');

  useEffect(() => {
    function updateStatus() {
      if (dayjs().isAfter(dayjs(closeDate))) {
        setStatus('Closed');
      } else if (dayjs().isAfter(dayjs(startDate))) {
        setStatus('Close In');
      }
    }

    updateStatus();

    const intervalId = window.setInterval(updateStatus, 1000);

    return () => window.clearInterval(intervalId);
  }, [startDate, closeDate]);

  return (
    <section
      className="relative flex w-full flex-col items-center border-b border-slate-200 pt-14 pb-25 text-center text-white"
      style={{ backgroundColor: FOREST }}
    >
      <HeroBackdrop />

      <div className="relative mt-10 flex flex-col items-center px-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#8DC63F]/30 bg-[#8DC63F]/10 px-3 py-1 text-xs font-medium tracking-wide text-[#C9E99E] sm:text-sm">
          Superteam
          <span className="text-[#8DC63F]" aria-hidden="true">
            ×
          </span>
          <span className="sr-only">and</span>
          CoinGecko
        </span>
        <h1
          className={cn(
            archivoBold.className,
            'mt-5 text-[2.75rem] leading-none tracking-[-0.02em] uppercase sm:text-6xl md:text-7xl lg:text-[5.5rem]',
          )}
        >
          <span style={{ color: GECKO_GREEN }}>Gecko</span>thon
        </h1>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[11px] tracking-[0.14em] text-white/70 uppercase sm:text-xs">
          <span>Learn from CoinGecko data</span>
          <span className="inline-flex items-center gap-2">
            <span className="text-[#8DC63F]" aria-hidden="true">
              ▲
            </span>
            Execute on Solana
          </span>
        </p>
      </div>
      <div className="relative mt-6 mb-1 flex w-full max-w-[42rem] flex-col items-center gap-5 px-4 text-white">
        <p className="text-sm text-balance text-white/85 sm:text-base">
          {description}
        </p>
        <Button
          variant="outline"
          className="mx-auto min-h-10 w-fit gap-3 rounded-[0.5rem] border-[#8DC63F]/40 bg-black/30 px-8 text-base text-white hover:bg-black/30 hover:text-white focus-visible:ring-2 focus-visible:ring-[#8DC63F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1D0D]"
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
          {status === 'Close In' && (
            <PulseIcon
              isPulsing={true}
              w={6}
              h={6}
              bg="#4be369"
              text="#16A34A"
            />
          )}
          {status === 'Start In' && (
            <PulseIcon
              isPulsing={false}
              w={8}
              h={8}
              bg="#ff9305"
              text="#ff9305"
            />
          )}
          {status === 'Start In' && 'Submissions Open Soon'}
          {status === 'Close In' && 'Submissions Open'}
          {status === 'Closed' && 'Submissions Closed'}
        </Button>
      </div>
      <div className="absolute bottom-0 mt-0 flex w-full max-w-[90%] translate-y-1/2 flex-row overflow-hidden rounded-2xl border-[1.14px] border-[#8DC63F]/60 md:w-fit">
        <HeroMini stats={stats} startDate={startDate} closeDate={closeDate} />
      </div>
    </section>
  );
}

type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
};

// Deterministic so server and client render the same chart.
const CANDLES: Candle[] = (() => {
  const count = 64;
  const candles: Candle[] = [];
  let price = 150;

  for (let i = 0; i < count; i++) {
    const noise = Math.sin(i * 12.9898) * 43758.5453;
    const rand = noise - Math.floor(noise);
    const trend = 1.6;
    const swing = (rand - 0.42) * 22 + Math.sin(i / 5) * 6;
    const open = price;
    const close = Math.max(20, open + trend + swing);
    const wick = 4 + rand * 10;

    candles.push({
      open,
      close,
      high: Math.max(open, close) + wick,
      low: Math.min(open, close) - wick * 0.8,
    });
    price = close;
  }

  return candles;
})();

const CHART_WIDTH = 1280;
const CHART_HEIGHT = 320;

function HeroBackdrop() {
  const max = Math.max(...CANDLES.map((c) => c.high));
  const min = Math.min(...CANDLES.map((c) => c.low));
  const step = CHART_WIDTH / CANDLES.length;
  const bodyWidth = step * 0.56;
  const y = (value: number) =>
    CHART_HEIGHT - ((value - min) / (max - min)) * (CHART_HEIGHT - 24) - 4;
  const trendLine = CANDLES.map(
    (c, i) => `${i === 0 ? 'M' : 'L'}${(i + 0.5) * step},${y(c.close)}`,
  ).join(' ');

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(141,198,63,0.22) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage:
            'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)',
        }}
      />
      <div
        className="absolute top-[-30%] left-1/2 h-[80%] w-[70rem] max-w-[160%] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(141,198,63,0.28), rgba(141,198,63,0) 100%)',
        }}
      />
      <svg
        className="absolute inset-x-0 bottom-0 h-[42%] w-full"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMidYMax slice"
        style={{
          maskImage: 'linear-gradient(to top, black 10%, transparent 95%)',
          WebkitMaskImage:
            'linear-gradient(to top, black 10%, transparent 95%)',
        }}
      >
        {CANDLES.map((c, i) => {
          const x = (i + 0.5) * step;
          const isUp = c.close >= c.open;
          const color = isUp ? GECKO_GREEN : '#3E5A34';
          const top = y(Math.max(c.open, c.close));
          const bottom = y(Math.min(c.open, c.close));

          return (
            <g key={i} opacity={isUp ? 0.55 : 0.5}>
              <line
                x1={x}
                x2={x}
                y1={y(c.high)}
                y2={y(c.low)}
                stroke={color}
                strokeWidth={1.5}
              />
              <rect
                x={x - bodyWidth / 2}
                y={top}
                width={bodyWidth}
                height={Math.max(2, bottom - top)}
                rx={1.5}
                fill={color}
              />
            </g>
          );
        })}
        <path
          d={trendLine}
          fill="none"
          stroke="#D6F5A8"
          strokeOpacity={0.45}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 45% 40% at 50% 62%, rgba(11,29,13,0.75), rgba(11,29,13,0) 100%), linear-gradient(to bottom, rgba(11,29,13,0) 55%, rgba(11,29,13,0.65) 100%)',
        }}
      />
    </div>
  );
}

function HeroMini({
  startDate,
  closeDate,
  stats,
}: {
  startDate: string | Date;
  closeDate: string | Date;
  stats: Stats | undefined;
}) {
  const isMd = useBreakpoint('md');
  const [countdownDate, setCountdownDate] = useState<Date>(
    dayjs.utc(startDate).toDate(),
  );
  const [status, setStatus] = useState<HackathonStatus>(() =>
    dayjs().isAfter(dayjs(closeDate))
      ? 'Closed'
      : dayjs().isAfter(dayjs(startDate))
        ? 'Close In'
        : 'Start In',
  );

  useEffect(() => {
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
    <div className="relative flex w-full items-center justify-center gap-8 rounded-md bg-[#8DC63F] px-6 py-6 text-[#0B1D0D] md:flex-row md:gap-12 md:rounded-xl md:px-16">
      <MiniStat
        title={isMd ? `Submissions ${status}` : mobileTitleForCountdown(status)}
      >
        {status !== 'Closed' ? (
          <Countdown
            date={countdownDate}
            renderer={CountDownRenderer}
            zeroPadDays={1}
          />
        ) : (
          '-'
        )}
      </MiniStat>
      <MiniStat title="Total Prizes">
        $
        {stats?.totalRewardAmount.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }) ?? '-'}
      </MiniStat>

      <MiniStat className="hidden sm:flex" title="Tracks">
        {stats?.totalListings ?? '-'}
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
          'flex flex-col items-start gap-1 md:items-start',
          className,
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-left text-xs font-medium text-[#0B1D0D]/70 md:w-max md:text-sm">
            {title}
          </span>
          {infotipContent && (
            <Info className="h-3 w-3 text-[#0B1D0D]/60" aria-hidden="true" />
          )}
        </span>
        <span className="text-lg font-bold md:text-2xl">{children}</span>
      </div>
    </Tooltip>
  );
}

function Tracks({
  tracks,
  isLoading,
  isError,
  onRetry,
}: {
  tracks: TrackProps[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <section id="tracks-section" className="sm:mx-6">
      <div className="max-w-7xl py-6 sm:mx-auto">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 md:text-xl">
          Submission Tracks
        </h2>
        {isLoading && (
          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading submission tracks"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none"
                aria-hidden="true"
              />
            ))}
          </div>
        )}
        {isError && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-700">
              We couldn't load the submission tracks.
            </p>
            <Button
              variant="outline"
              className="mt-4 min-h-10 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              onClick={onRetry}
            >
              Try Again
            </Button>
          </div>
        )}
        {!isLoading && !isError && tracks?.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-700">
            Submission tracks are coming soon.
          </div>
        )}
        {!isLoading && !isError && tracks && tracks.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <TrackBox
                key={track.slug}
                title={track.title}
                sponsor={track.sponsor}
                token={track.token}
                rewardAmount={track.rewardAmount}
                slug={track.slug}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const faqs: { question: string; answer: string }[] = [
  {
    question: 'What is Geckothon?',
    answer:
      'Geckothon is a hackathon hosted by Superteam and CoinGecko for Solana builders around the world. The theme is simple: learn from CoinGecko data and execute on Solana.',
  },
  {
    question: 'What are the tracks?',
    answer:
      'There are three tracks. <strong>Consumer</strong>: widgets, frontends and apps built on CoinGecko data for humans, like a public equities terminal. <strong>Agents</strong>: automations and alerts run by agents, like treasury rebalancing or token due diligence. <strong>Analytics</strong>: niche, gamified data frontends, like a memecoin league table or ownership coin dashboards.',
  },
  {
    question: 'What can I win?',
    answer:
      'Superteam is giving away $25,000 in cash prizes across 10 winners, and CoinGecko is giving 1 year of enterprise API credits to the top 25 submissions.',
  },
  {
    question: 'When do submissions close and when are winners announced?',
    answer:
      'Geckothon runs from December 1st to December 15th. Submissions close on December 15th, and results will be announced on December 22nd.',
  },
  {
    question: 'Is Geckothon online or in person?',
    answer:
      'Geckothon is online, with some offline hubs and events. CoinGecko will host workshops, office hours and troubleshooting sessions with Superteam chapters during the hackathon, and some chapters may host IRL build stations and co-working sessions.',
  },
  {
    question: 'Where can I find developer resources for my project?',
    answer:
      'Check out the <a href="https://docs.coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko API documentation</a> to get started with CoinGecko data.',
  },
];

function FAQs() {
  return (
    <section className="mt-4 flex flex-col items-center px-1 py-8 md:mt-8">
      <h2 className="pb-2 text-4xl font-bold md:text-5xl">FAQ</h2>
      <div className="w-full max-w-[35rem]">
        <Accordion type="single" collapsible>
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.question}
              value={faq.question}
              className="my-4 rounded-lg border shadow-md"
            >
              <AccordionTrigger className="rounded px-4 py-3 text-left font-normal text-slate-500 hover:bg-black/5 hover:no-underline focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 data-[state=open]:bg-black/5">
                <span className="flex-1 text-left text-sm sm:text-base">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-3 text-sm text-slate-700 sm:text-base [&_a]:text-[#3E7A12] [&_a]:underline">
                <div
                  dangerouslySetInnerHTML={{
                    __html: domPurify(faq.answer),
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const hackathon = await prisma.hackathon.findUnique({
    where: {
      slug: SLUG,
    },
    include: {
      Sponsor: true,
    },
  });

  if (!hackathon) throw Error('Hackathon not found');

  return {
    props: {
      hackathon: {
        ...hackathon,
        deadline: hackathon.deadline?.toISOString() || null,
        startDate: hackathon.startDate?.toISOString() || null,
        announceDate: hackathon.announceDate?.toISOString() || null,
        Sponsor: hackathon.Sponsor
          ? {
              ...hackathon.Sponsor,
              createdAt: hackathon.Sponsor.createdAt.toISOString(),
              updatedAt: hackathon.Sponsor.updatedAt.toISOString(),
            }
          : null,
      },
    },
  };
};
