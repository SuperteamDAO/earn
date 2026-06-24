import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import localFont from 'next/font/local';
import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';
import Countdown, { type CountdownRenderProps } from 'react-countdown';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ASSET_URL } from '@/constants/ASSET_URL';
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
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

type Hackathon = HackathonGetPayload<{
  include: {
    Sponsor: true;
  };
}>;

type HackathonStatus = 'Open' | 'Closed';
type CountdownMode = 'Begins' | 'Left' | 'Review';

const SLUG = 'world-cup';
const WORLD_CUP_ASSET_BASE = `${ASSET_URL}/hackathon/world-cup`;
const WORLD_CUP_BG_IMAGE = `${WORLD_CUP_ASSET_BASE}/bg.png`;
const WORLD_CUP_MOBILE_BG_IMAGE = `${WORLD_CUP_ASSET_BASE}/bg-mobile.png`;
const WORLD_CUP_OG_IMAGE = `${WORLD_CUP_ASSET_BASE}/og.png`;
const WORLD_CUP_TX_LOGO = `${WORLD_CUP_ASSET_BASE}/txOdds.png`;

const digital7Italic = localFont({
  src: '../../../../public/fonts/digital-7-italic.ttf',
  display: 'swap',
});

const archivoHeavy = localFont({
  src: '../../../../public/fonts/Archivo_SemiExpanded-Bold.ttf',
  display: 'swap',
});

export default function WorldCup({ hackathon }: { hackathon: Hackathon }) {
  if (!hackathon.startDate || !hackathon.deadline) {
    throw new Error('Start Date and deadline missing');
  }

  const START_DATE = hackathon.startDate;
  const CLOSE_DATE = hackathon.deadline;
  const heroLogo = hackathon.altLogo || hackathon.logo;

  const { data: trackData } = useQuery(trackDataQuery(SLUG));
  const { data: stats } = useQuery(statsDataQuery(SLUG));

  return (
    <Default
      className="bg-white"
      meta={
        <>
          <meta name="twitter:image" content={WORLD_CUP_OG_IMAGE} />
          <Meta
            title="World Cup Hackathon | Superteam Earn"
            description="A World Cup hackathon for builders creating real-time match data, trading agents, prediction markets, and fan experiences."
            canonical="https://superteam.fun/earn/hackathon/world-cup/"
            og={WORLD_CUP_OG_IMAGE}
          />
        </>
      }
    >
      <Hero
        START_DATE={START_DATE}
        CLOSE_DATE={CLOSE_DATE}
        heroLogo={heroLogo}
      />
      <main className="mx-auto mt-16 mb-20 w-full max-w-[41rem] px-4 sm:mt-18">
        <PrizeSummary stats={stats} />
        <Tracks tracks={trackData} />
        <FAQs />
      </main>
    </Default>
  );
}

function Hero({
  START_DATE,
  CLOSE_DATE,
  heroLogo,
}: {
  START_DATE: string | Date;
  CLOSE_DATE: string | Date;
  heroLogo: string;
}) {
  const [status, setStatus] = useState<HackathonStatus>('Open');
  const [countdownMode, setCountdownMode] = useState<CountdownMode>('Left');
  const [isCountdownReady, setIsCountdownReady] = useState(false);
  const [countdownDate, setCountdownDate] = useState<Date>(
    dayjs.utc(CLOSE_DATE).toDate(),
  );

  useEffect(() => {
    setIsCountdownReady(true);

    function updateStatus() {
      const now = dayjs();

      if (now.isAfter(dayjs(CLOSE_DATE))) {
        setStatus('Closed');
        setCountdownMode('Review');
        setCountdownDate(dayjs.utc(CLOSE_DATE).toDate());
      } else if (now.isBefore(dayjs(START_DATE))) {
        setStatus('Open');
        setCountdownMode('Begins');
        setCountdownDate(dayjs.utc(START_DATE).toDate());
      } else {
        setStatus('Open');
        setCountdownMode('Left');
        setCountdownDate(dayjs.utc(CLOSE_DATE).toDate());
      }
    }

    updateStatus();

    const intervalId = window.setInterval(updateStatus, 1000);

    return () => window.clearInterval(intervalId);
  }, [START_DATE, CLOSE_DATE]);

  const dateRange = `${dayjs
    .utc(START_DATE)
    .format('D MMMM')} - ${dayjs.utc(CLOSE_DATE).format('D MMMM')}`;
  const isUpcoming = countdownMode === 'Begins';
  const isReview = status === 'Closed';

  return (
    <section className="px-3 pt-4 sm:px-4 md:px-2 md:pt-2">
      <div className="relative mx-auto flex min-h-[22rem] w-full max-w-[91rem] flex-col items-center overflow-hidden rounded-xl border border-slate-200 bg-[#17275a] text-center text-white shadow-sm sm:min-h-[27.5rem] md:min-h-[25.5rem]">
        <Image
          src={WORLD_CUP_MOBILE_BG_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center md:hidden"
        />
        <Image
          src={WORLD_CUP_BG_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-center md:block"
        />
        <div
          className={cn(
            'absolute top-0 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-b-[1rem] bg-slate-950/38 px-4 py-2 text-base font-medium whitespace-nowrap shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_10px_24px_rgba(15,23,42,0.24)] backdrop-blur-2xl sm:px-5 sm:text-lg md:gap-2 md:px-4 md:pt-3 md:pb-3 md:text-sm',
            isUpcoming || isReview ? 'text-[#FDFFA4]' : 'text-[#9bff63]',
          )}
        >
          <span
            className={cn(
              'grid size-4 place-items-center rounded-full md:size-3.5',
              isUpcoming || isReview ? 'bg-[#FFED4C3D]' : 'bg-[#97E9593D]',
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full font-semibold shadow-[1px_1px_2px_rgba(0,0,0,0.2)] md:size-1.5',
                isUpcoming || isReview ? 'bg-[#FFED4C]' : 'bg-[#97E959]',
              )}
            />
          </span>
          {isUpcoming && 'Submissions open soon'}
          {!isUpcoming && status === 'Open' && 'Submissions open'}
          {isReview && 'In Review'}
        </div>
        <div className="relative z-10 mt-[6.75rem] flex flex-col items-center sm:mt-[7.5rem] md:mt-[6.5rem]">
          <Image
            src={heroLogo}
            alt="World Cup"
            width={1000}
            height={324}
            priority
            className="h-auto w-[15rem] drop-shadow-[0_8px_0_rgba(17,24,39,0.62)] sm:w-[19rem] md:w-[27.5rem]"
          />
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-normal text-white sm:mt-5 sm:gap-3 sm:text-base md:mt-4 md:gap-3 md:text-base">
            <span>Powered by</span>
            <Image
              src={WORLD_CUP_TX_LOGO}
              alt="TxODDS"
              width={112}
              height={70}
              priority
              className="h-3 w-auto object-contain sm:h-3 md:h-4"
            />
          </div>
          <div
            className={cn(
              archivoHeavy.className,
              'mt-5 rounded-full bg-[#03030340] px-6 py-2.5 text-sm font-black tracking-wide text-white uppercase shadow-[inset_0_2px_3px_rgba(255,255,255,0.12),0_4px_12px_rgba(15,23,42,0.3)] backdrop-blur-lg sm:mt-6 sm:px-8 sm:py-3 sm:text-base md:mt-5 md:px-6 md:py-3 md:text-sm',
            )}
          >
            {dateRange}
          </div>
        </div>
      </div>
      <div className="relative z-20 -mt-6 flex justify-center sm:-mt-10 md:-mt-9">
        {isCountdownReady ? (
          <Countdown
            date={countdownDate}
            renderer={(props) => (
              <DigitalTimer {...props} mode={countdownMode} status={status} />
            )}
            zeroPadTime={2}
            zeroPadDays={2}
          />
        ) : (
          <DigitalTimerShell isReview={status === 'Closed'}>
            {countdownMode === 'Begins' && (
              <span className="mr-4">BEGINS IN</span>
            )}
            <TimerUnit value="00" unit="D" />
            <TimerSeparator />
            <TimerUnit value="00" unit="H" />
            <TimerSeparator />
            <TimerUnit value="00" unit="M" />
            <TimerSeparator />
            <TimerUnit value="00" unit="S" />
            {countdownMode === 'Left' && <span className="ml-4">LEFT</span>}
          </DigitalTimerShell>
        )}
      </div>
    </section>
  );
}

function DigitalTimer({
  days,
  hours,
  minutes,
  seconds,
  mode,
  status,
}: CountdownRenderProps & {
  mode: CountdownMode;
  status: HackathonStatus;
}) {
  return (
    <DigitalTimerShell isReview={status === 'Closed'}>
      {status !== 'Closed' && mode !== 'Review' ? (
        <>
          {mode === 'Begins' && <span className="mr-4">BEGINS IN</span>}
          <TimerUnit value={days} unit="D" />
          <TimerSeparator />
          <TimerUnit value={padTimeUnit(hours)} unit="H" />
          <TimerSeparator />
          <TimerUnit value={padTimeUnit(minutes)} unit="M" />
          <TimerSeparator />
          <TimerUnit value={padTimeUnit(seconds)} unit="S" />
          {mode === 'Left' && <span className="ml-4">LEFT</span>}
        </>
      ) : (
        'In Review'
      )}
    </DigitalTimerShell>
  );
}

function DigitalTimerShell({
  children,
  isReview = false,
}: {
  children: ReactNode;
  isReview?: boolean;
}) {
  return (
    <div
      className={cn(
        digital7Italic.className,
        'flex w-[18rem] items-center justify-center border-2 border-[#B7B7AB] bg-[#101010] px-3 py-3 text-[1.6rem] leading-none tracking-normal uppercase shadow-[0_8px_12px_rgba(15,23,42,0.35),inset_0_0_14px_rgba(0,0,0,0.5),inset_0_1px_10px_rgba(255,255,255,0.5)] sm:w-[38rem] sm:border-[5px] sm:px-8 sm:py-4 sm:text-[3.5rem] md:w-[28rem] md:px-6 md:py-3 md:text-[2.25rem] [&_.timer-unit]:text-[0.58em]',
        isReview ? 'text-[#FDFFA4]' : 'text-[#FF0404]',
      )}
      style={{
        fontStyle: 'italic',
        WebkitTextStroke: '0.5px #510000',
      }}
    >
      {children}
    </div>
  );
}

function TimerUnit({ value, unit }: { value: string | number; unit: string }) {
  return (
    <span className="inline-flex items-baseline">
      {value}
      <span className="timer-unit">{unit}</span>
    </span>
  );
}

function TimerSeparator() {
  return <span className="mx-[5px]">:</span>;
}

function padTimeUnit(value: number) {
  return value.toString().padStart(2, '0');
}

function PrizeSummary({ stats }: { stats: Stats | undefined }) {
  return (
    <section className="flex flex-col gap-1 overflow-hidden text-[#4B4C91]">
      <div className="flex items-center justify-between rounded-md bg-[#6366F11C] px-5 py-4">
        <p className="text-2xl font-extrabold">
          $
          {stats?.totalRewardAmount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }) ?? '50,000'}{' '}
          <span className="text-xl font-medium text-[#4B4C91CC]">USD</span>
        </p>
        <p className="text-sm font-semibold text-[#4B4C91]">Prize Pool</p>
      </div>
      <div className="rounded-md bg-[#6366F11C] px-5 py-4 text-[14px] leading-relaxed font-medium text-[#4b5796]">
        A World Cup hackathon for builders who want real-time match data wired
        into real products. $50K across three tracks: markets, trading agents,
        and fan experiences. All powered by TxODDS’ live football API on Solana.
      </div>
    </section>
  );
}

function Tracks({ tracks }: { tracks: Track[] | undefined }) {
  return (
    <section id="tracks-section" className="mt-8">
      <h2 className="mb-4 text-base font-medium text-[#626262]">
        Submission Tracks
      </h2>
      <div className="space-y-3">
        {tracks?.map((track, index) => (
          <WorldCupTrackCard
            key={track.slug}
            track={track}
            description={getTrackDescription(index)}
            image={getTrackImage(index)}
          />
        ))}
      </div>
    </section>
  );
}

type Track = {
  title: string;
  slug: string;
  token: string;
  rewardAmount: number;
  sponsor: {
    name: string;
    logo: string;
  };
};

const DEFAULT_TRACK_IMAGE = `${WORLD_CUP_ASSET_BASE}/trading.png`;
const trackImages = [
  `${WORLD_CUP_ASSET_BASE}/prediction.png`,
  DEFAULT_TRACK_IMAGE,
  `${WORLD_CUP_ASSET_BASE}/consumer.png`,
];

function getTrackImage(index: number): string {
  return trackImages[index] ?? DEFAULT_TRACK_IMAGE;
}

function WorldCupTrackCard({
  track,
  description,
  image,
}: {
  track: Track;
  description: string;
  image: string;
}) {
  return (
    <Link
      href={`/earn/listing/${track.slug}`}
      className="grid grid-cols-[8.75rem_1fr] overflow-hidden rounded-md bg-[#F8F8F8] text-left shadow-[inset_0_0_0_1px_#F0F0F0] transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-[#7C35F622] sm:grid-cols-[13.5rem_1fr] [@media(hover:hover)]:hover:bg-[#7C35F622]"
    >
      <div
        className="min-h-36 bg-[#183372] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(26, 64, 151, 0.12), rgba(26, 64, 151, 0.12)), url('${image}')`,
        }}
        aria-hidden="true"
      />
      <div className="flex min-h-36 flex-col justify-between px-4 py-4">
        <div>
          <h3 className="text-[12px] font-semibold text-[#0F172B] sm:text-sm">
            {track.title}
          </h3>
          <p className="mt-2 text-[11px] leading-[1.25] text-[#62748E] sm:line-clamp-3 sm:text-xs sm:leading-relaxed">
            {description}
          </p>
        </div>
        <p className="mt-4 text-right text-sm font-semibold text-[#4B4C91]">
          $
          {track.rewardAmount?.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{' '}
          <span className="font-semibold text-[#4B4C9166]">USD</span>
        </p>
      </div>
    </Link>
  );
}

const DEFAULT_TRACK_DESCRIPTION =
  'Build with live World Cup data across markets, agents, and fan experiences.';

const trackDescriptions = [
  'The flagship track. Markets, resolution and settlement built on verifiable World Cup data: outcome markets, oracle tooling, on-chain proof integrations.',
  'Create autonomous agents that ingest TxODDS’ live odds and scores, detect signals, run strategies, and execute decisions without manual input.',
  'Build fan-facing World Cup apps, games, bots, or social experiences that use TxODDS’ live match data to update instantly during games and keep fans engaged.',
];

function getTrackDescription(index: number): string {
  return trackDescriptions[index] ?? DEFAULT_TRACK_DESCRIPTION;
}

const faqs: { question: string; answer: ReactNode | string }[] = [
  {
    question: 'Who can participate (individuals, teams, companies)?',
    answer:
      'Participation is open to individuals, teams, and companies. All structures are welcome to register and compete, provided they meet the core track requirements.',
  },
  {
    question: 'What is the maximum team size?',
    answer: 'Teams may consist of 1 to 3 members.',
  },
  {
    question: 'Can a team enter multiple tracks?',
    answer:
      "Yes, but not with the same project. You cannot submit one application to multiple tracks. If you want to enter a second track, you must submit a completely separate, distinct project built specifically for that track's criteria.",
  },
  {
    question: 'Can one team win multiple prizes?',
    answer:
      'Yes. Since you must build and submit entirely different projects for each track, a team is eligible to win a prize in each track they enter.',
  },
  {
    question:
      'Are previous or legacy projects allowed if they integrate TxODDS now?',
    answer:
      'No. All submissions must be built specifically for this hackathon/initiative.',
  },
];

function FAQs() {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-base font-medium text-[#626262]">FAQs</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.question}
            value={faq.question}
            className="rounded-md border-0 bg-[#F7F7F7] px-4"
          >
            <AccordionTrigger
              className={cn(
                'group py-4 text-left text-sm font-semibold text-[#717171] hover:no-underline [&>svg]:hidden',
              )}
            >
              <span className="pr-4">{faq.question}</span>
              <span
                aria-hidden="true"
                className="relative ml-4 size-2 shrink-0 text-[#959595] transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
              >
                <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
                <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current transition-transform duration-200 ease-out group-data-[state=open]:scale-y-0" />
              </span>
            </AccordionTrigger>
            <AccordionContent className="-mx-4 bg-[#FAFBFA] px-4 pb-4 text-sm leading-relaxed text-[#727272]">
              {typeof faq.answer === 'string' ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: domPurify(faq.answer),
                  }}
                />
              ) : (
                faq.answer
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
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
