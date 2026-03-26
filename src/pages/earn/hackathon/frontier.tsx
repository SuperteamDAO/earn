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
import { ASSET_URL } from '@/constants/ASSET_URL';
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

export default function Frontier({ hackathon }: { hackathon: Hackathon }) {
  const slug = 'frontier';

  if (!hackathon.startDate || !hackathon.deadline) {
    throw new Error('Start Date and deadline missing');
  }

  const START_DATE = hackathon.startDate;
  const CLOSE_DATE = hackathon.deadline;

  const { data: trackData } = useQuery(trackDataQuery(slug));
  const { data: stats } = useQuery(statsDataQuery(slug));

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Frontier | Superteam Earn"
          description="Solana Frontier Online Hackathon"
          canonical="https://superteam.fun/earn/hackathon/frontier/"
          og={ASSET_URL + '/hackathon/frontier/og.webp'}
        />
      }
    >
      <Hero stats={stats} START_DATE={START_DATE} CLOSE_DATE={CLOSE_DATE} />
      <div className="mx-auto mt-14 mb-20 w-full max-w-7xl px-4 md:mt-14 xl:mt-16">
        <Tracks tracks={trackData} />
        <FAQs />
      </div>
    </Default>
  );
}

function Hero({
  START_DATE,
  CLOSE_DATE,
  stats,
}: {
  START_DATE: string | Date;
  CLOSE_DATE: string | Date;
  stats: Stats | undefined;
}) {
  const [status, setStatus] = useState<HackathonStatus>('Start In');

  useEffect(() => {
    function updateStatus() {
      if (dayjs().isAfter(dayjs(CLOSE_DATE))) {
        setStatus('Closed');
      } else if (dayjs().isAfter(dayjs(START_DATE))) {
        setStatus('Close In');
      }
    }

    updateStatus();

    const intervalId = window.setInterval(updateStatus, 1000);

    return () => window.clearInterval(intervalId);
  }, [START_DATE, CLOSE_DATE]);

  return (
    <div
      className="relative flex w-full flex-col items-center border-b border-slate-200 bg-[#FFF1CE] bg-cover bg-center bg-no-repeat pt-14 pb-25 text-center text-white"
      style={{
        backgroundImage: `url('${ASSET_URL + '/hackathon/frontier/bg.webp'}')`,
      }}
    >
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <div className="relative w-full max-w-[18rem] sm:max-w-[22rem] md:max-w-[28rem]">
        <Image
          src={ASSET_URL + '/hackathon/frontier/logo.webp'}
          alt="Frontier"
          width={1120}
          height={320}
          priority
          className="mt-12 h-auto w-full"
        />
      </div>
      <div className="relative mt-4 mb-1 flex w-full max-w-[18.5rem] flex-col items-center gap-4 text-white sm:w-auto sm:max-w-none">
        <p className="text-sm sm:text-base">
          Submit to side tracks of the latest Solana Global Hackathon
        </p>
        <div className="flex w-full flex-col gap-1 sm:flex-row">
          <Button
            variant="outline"
            className="mx-auto w-fit gap-3 rounded-[0.5rem] border-white/40 bg-black/20 px-8 text-base text-white hover:bg-black/35"
            onClick={() => {
              const tracksSection = document.getElementById('tracks-section');
              if (tracksSection) {
                const elementPosition =
                  tracksSection.getBoundingClientRect().top;
                const offsetPosition =
                  elementPosition + window.pageYOffset - 60;

                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth',
                });
              }
            }}
          >
            {status === 'Close In' && (
              <PulseIcon
                isPulsing={true}
                w={6}
                h={6}
                bg={'#4be369'}
                text="#16A34A"
              />
            )}
            {status === 'Start In' && (
              <PulseIcon
                isPulsing={false}
                w={8}
                h={8}
                bg={'#ff9305'}
                text="#f9305"
              />
            )}
            {status === 'Start In' && 'Submissions Open Soon'}
            {status === 'Close In' && 'Submissions Open'}
            {status === 'Closed' && 'Submissions Closed'}
          </Button>
        </div>
      </div>
      <div className="absolute bottom-[-16%] mt-0 flex w-full max-w-[90%] flex-row overflow-hidden rounded-2xl border-[1.14px] border-white/50 md:w-fit">
        <HeroMini
          stats={stats}
          START_DATE={START_DATE}
          CLOSE_DATE={CLOSE_DATE}
        />
      </div>
    </div>
  );
}

function HeroMini({
  START_DATE,
  CLOSE_DATE,
  stats,
}: {
  START_DATE: string | Date;
  CLOSE_DATE: string | Date;
  stats: Stats | undefined;
}) {
  const isMd = useBreakpoint('md');
  const [countdownDate, setCountdownDate] = useState<Date>(
    dayjs.utc(START_DATE).toDate(),
  );
  const [status, setStatus] = useState<HackathonStatus>(() =>
    dayjs().isAfter(dayjs(CLOSE_DATE))
      ? 'Closed'
      : dayjs().isAfter(dayjs(START_DATE))
        ? 'Close In'
        : 'Start In',
  );

  useEffect(() => {
    function updateStatus() {
      if (dayjs().isAfter(dayjs(CLOSE_DATE))) {
        setStatus('Closed');
      } else if (dayjs().isAfter(dayjs(START_DATE))) {
        setCountdownDate(dayjs.utc(CLOSE_DATE).toDate());
        setStatus('Close In');
      }
    }

    updateStatus();

    const intervalId = window.setInterval(updateStatus, 1000);

    return () => window.clearInterval(intervalId);
  }, [START_DATE, CLOSE_DATE]);

  return (
    <div className="relative flex w-full items-center justify-center gap-8 rounded-md bg-black px-6 py-6 md:flex-row md:gap-12 md:rounded-xl md:px-16">
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
      <MiniStat title={'Total Prizes'}>
        $
        {stats?.totalRewardAmount.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }) ?? '-'}
      </MiniStat>

      <MiniStat className="hidden sm:flex" title={'Tracks'}>
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
          <p className="text-left text-xs text-white/80 md:w-max md:text-sm">
            {title}
          </p>
          {infotipContent && <Info className="h-3 w-3 text-gray-400" />}
        </span>
        <p className="text-lg font-bold md:text-2xl">{children}</p>
      </div>
    </Tooltip>
  );
}

function Tracks({ tracks }: { tracks: TrackProps[] | undefined }) {
  return (
    <div id="tracks-section" className="sm:mx-6">
      <div className="max-w-7xl py-6 sm:mx-auto">
        <p className="mb-4 text-lg font-semibold text-slate-900 md:text-xl">
          Submission Tracks
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tracks?.map((track) => (
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
      </div>
    </div>
  );
}

const faqs: { question: string; answer: string }[] = [
  {
    question:
      'How are Sidetracks different from the main Colosseum Frontier tracks?',
    answer:
      'Sidetracks are extra challenges hosted by Superteam Earn, separate from Colosseum’s Frontier tracks. They offer additional opportunities to build unique projects and win special prizes.',
  },
  {
    question: 'Do I need to submit separately to Sidetracks on Superteam Earn?',
    answer:
      'Yes! Sidetracks have their own submission process on Superteam Earn. Make sure you submit your project directly to each Sidetrack you wish to enter.',
  },
  {
    question: 'When will Sidetrack winners be announced?',
    answer:
      'Sidetrack winners will be announced shortly after the main Colosseum Frontier winners. If you submitted a project to a Sidetrack, we’ll email you directly when winners are announced.',
  },
  {
    question: 'Can I submit my project to multiple Sidetracks?',
    answer:
      'Yes, you’re welcome to submit your project to as many Sidetracks as you like, as long as your submission fits each Sidetrack’s requirements.',
  },
  {
    question: 'Where can I find developer resources for my project?',
    answer:
      'Check out <a href="https://www.colosseum.com/frontier/resources" target="_blank">Colosseum’s Developer Resources page</a>. You’ll find documentation, tools, tutorials, and everything you need to build on Solana.',
  },
  {
    question: 'What is the evaluation criteria for Sidetracks?',
    answer:
      'Each Sidetrack sponsor defines their own evaluation criteria. Be sure to carefully review the description and judging guidelines for each Sidetrack you’re submitting to.',
  },
];

function FAQs() {
  return (
    <div className="mt-4 flex flex-col items-center px-1 py-8 md:mt-8">
      <h2 className="pb-2 text-4xl font-bold md:text-5xl">FAQ</h2>
      <div className="w-full max-w-[35rem]">
        <Accordion type="single" collapsible>
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.question}
              value={faq.question}
              className="my-4 rounded-lg border shadow-md"
            >
              <AccordionTrigger className="rounded px-4 py-3 text-left font-normal text-slate-500 hover:bg-black/5 hover:no-underline focus:no-underline data-[state=open]:bg-black/5">
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
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const hackathon = await prisma.hackathon.findUnique({
    where: {
      slug: 'frontier',
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
        Sponsor: {
          ...hackathon.Sponsor,
          createdAt: hackathon.Sponsor?.createdAt.toISOString() || null,
          updatedAt: hackathon.Sponsor?.updatedAt.toISOString() || null,
        },
      },
    },
  };
};
