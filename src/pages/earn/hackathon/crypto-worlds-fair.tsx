import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import Image from 'next/image';
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

const SLUG = 'crypto-worlds-fair';
const BACKGROUND_IMAGE =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1788934363/assets/hackathon/crypto-world-fair/bg-wo-logo.png';
const OG_IMAGE =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1788934366/assets/hackathon/crypto-world-fair/og.png';
const HERO_LOGO =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1788934363/assets/hackathon/crypto-world-fair/logo-alt.png';

export default function CryptoWorldFair({
  hackathon,
}: {
  hackathon: Hackathon;
}) {
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
          title="Crypto World's Fair | Superteam Earn"
          description={hackathon.description}
          canonical="https://superteam.fun/earn/hackathon/crypto-world-fair/"
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
      <div className="mx-auto mt-14 mb-20 w-full max-w-7xl px-4 md:mt-14 xl:mt-16">
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
      className="relative flex w-full flex-col items-center border-b border-slate-200 bg-[#FFF1CE] bg-cover bg-center bg-no-repeat pt-14 pb-25 text-center text-white"
      style={{
        backgroundImage: `url('${BACKGROUND_IMAGE}')`,
      }}
    >
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <div className="relative w-full max-w-[18rem] sm:max-w-[24rem] md:max-w-[32rem]">
        <Image
          src={HERO_LOGO}
          alt="Crypto World's Fair"
          width={1120}
          height={320}
          priority
          className="mt-12 h-auto w-full"
        />
      </div>
      <div className="relative mt-4 mb-1 flex w-full max-w-[42rem] flex-col items-center gap-4 px-4 text-white">
        <p className="text-sm sm:text-base">{description}</p>
        <Button
          variant="outline"
          className="mx-auto min-h-10 w-fit gap-3 rounded-[0.5rem] border-white/40 bg-black/20 px-8 text-base text-white hover:bg-black/35 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/35"
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
      <div className="absolute bottom-[-16%] mt-0 flex w-full max-w-[90%] flex-row overflow-hidden rounded-2xl border-[1.14px] border-white/50 md:w-fit">
        <HeroMini stats={stats} startDate={startDate} closeDate={closeDate} />
      </div>
    </section>
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
    <div className="relative flex w-full items-center justify-center gap-8 rounded-md bg-[#65496F] px-6 py-6 text-white md:flex-row md:gap-12 md:rounded-xl md:px-16">
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
          <span className="text-left text-xs text-white/80 md:w-max md:text-sm">
            {title}
          </span>
          {infotipContent && (
            <Info className="h-3 w-3 text-gray-400" aria-hidden="true" />
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
    question: 'How are sidetracks different from the main hackathon tracks?',
    answer:
      'Sidetracks are extra challenges hosted on Superteam Earn. They offer additional opportunities to build unique projects and win special prizes.',
  },
  {
    question: 'Do I need to submit separately to sidetracks on Superteam Earn?',
    answer:
      'Yes. Sidetracks have their own submission process on Superteam Earn. Submit your project directly to each sidetrack you wish to enter.',
  },
  {
    question: 'When will sidetrack winners be announced?',
    answer:
      'Sidetrack winners will be announced after judging is complete. We will email entrants when winners are announced.',
  },
  {
    question: 'Can I submit my project to multiple sidetracks?',
    answer:
      'Yes, you can submit to multiple sidetracks as long as your project fits each sidetrack’s requirements.',
  },
  {
    question: 'Where can I find developer resources for my project?',
    answer:
      'Developer resources and documentation will be added here before submissions open.',
  },
  {
    question: 'What are the evaluation criteria for sidetracks?',
    answer:
      'Each sidetrack sponsor defines its evaluation criteria. Review the description and judging guidelines for every sidetrack you enter.',
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
              <AccordionContent className="px-4 pt-3 text-sm text-slate-700 sm:text-base [&_a]:text-blue-700">
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
