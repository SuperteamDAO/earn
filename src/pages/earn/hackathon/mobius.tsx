import {
  BarChartIcon as ChartNoAxesCombined,
  Brain,
  Gamepad2,
  Info,
  type LucideIcon,
  Megaphone,
  Trophy,
} from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { Orbitron } from 'next/font/google';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Tooltip } from '@/components/ui/tooltip';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { type HackathonGetPayload } from '@/prisma/models/Hackathon';
import { PulseIcon } from '@/svg/pulse-icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

const base = `/hackathon/mobius/`;
const baseAsset = (filename: string) => base + filename;

const tracks: TrackProps[] = [
  {
    Icon: Megaphone,
    title: 'Attention Capital Market Track',
    subtext:
      'User acquisition & content tokenization across social media platforms such as TikTok, X, Instagram, etc.',
    slug: 'mobius-acm',
    rewardAmount: 150_000,
    sponsors: [
      {
        name: 'Solana',
        src: baseAsset('solana'),
      },
    ],
  },
  {
    Icon: ChartNoAxesCombined,
    title: 'DeFi Track',
    subtext:
      'Asset launchpad, trading bot, yield generating, lending, MEV, etc.',
    slug: 'mobius-defi',
    rewardAmount: 150_000,
    sponsors: [
      {
        name: 'Defi Track',
        src: baseAsset('defi-track'),
      },
    ],
  },
  {
    Icon: Brain,
    title: 'AI Track',
    subtext:
      'Agent aggregators, tooling, initial agent offerings, and other infras.',
    slug: 'mobius-ai',
    rewardAmount: 150_000,
    sponsors: [
      {
        name: 'Send AI',
        src: baseAsset('send-ai'),
      },
      {
        name: 'ai-track-2',
        src: baseAsset('ai-track-2'),
      },
    ],
  },
  {
    Icon: Gamepad2,
    title: 'Gaming Track',
    subtext: 'Mini games, social games, FOCG, high-ARPU games, etc.',
    slug: 'mobius-gaming',
    rewardAmount: 150_000,
    sponsors: [
      {
        name: 'Send Arcade',
        src: baseAsset('send-arcade'),
      },
    ],
  },
];

type Hackathon = HackathonGetPayload<{
  include: {
    Sponsor: true;
  };
}>;
export default function Mobius({ hackathon }: { hackathon: Hackathon }) {
  if (!hackathon.startDate || !hackathon.deadline)
    throw new Error('Start Date and deadline missing');
  const START_DATE = hackathon.startDate;
  const CLOSE_DATE = hackathon.deadline;

  return (
    <Default
      className="bg-white"
      meta={
        <>
          <meta
            name="twitter:image"
            content={`https://res.cloudinary.com/dgvnuwspr/image/upload/v1740832046/assets/hackathon/mobius/sonic-mobius-og.png`}
          />
          <Meta
            title="Sonic Mobius | Superteam Earn"
            description={`Join the first-ever SVM hackathon on Solana – Sonic Mobius Hackathon – with a $1,000,000 prize pool! Build, launch on Sonic SVM Mainnet, and onboard the next billion users.`}
            canonical="https://earn.superteam.fun/hackathon/mobius"
            og="https://res.cloudinary.com/dgvnuwspr/image/upload/v1740832046/assets/hackathon/mobius/sonic-mobius-og.png"
          />
        </>
      }
    >
      <Hero START_DATE={START_DATE} CLOSE_DATE={CLOSE_DATE} />
      <div className="mx-auto mt-5 w-full max-w-5xl px-4 md:mt-24 xl:mt-28">
        <GrandPrize />
        <Tracks />
        <FAQs />
      </div>
    </Default>
  );
}
function Hero({
  START_DATE,
  CLOSE_DATE,
}: {
  START_DATE: string | Date;
  CLOSE_DATE: string | Date;
}) {
  const isMd = useBreakpoint('md');
  return (
    <div
      className="relative flex w-full flex-col items-center border-b border-slate-200 bg-cover bg-center bg-no-repeat pt-8 pb-6 text-center text-white md:pb-20"
      style={{
        backgroundImage: `url('${ASSET_URL + baseAsset(isMd ? 'banner' : 'banner-mobile-v2')}')`,
      }}
    >
      <ExternalImage alt="Sonic" src={baseAsset('sonic')} className="w-28" />
      <p
        className={`${orbitron.className} px-6 text-[2.5rem] leading-[2.84rem] font-medium md:mt-2 md:font-normal`}
      >
        Sonic Mobius Hackathon
      </p>
      <p
        className={`${orbitron.className} mt-3 max-w-[18.5rem] px-6 md:mt-1 md:max-w-none md:text-lg md:font-medium`}
      >
        The first SVM hackathon on Solana
      </p>
      <div className="mt-8 mb-1 flex w-full max-w-[18.5rem] flex-col items-center gap-4 md:mt-8 md:w-auto md:max-w-none">
        <div className={`${orbitron.className}`}>
          <p className="font-medium">
            {dayjs(START_DATE).format('MMM.DD, YYYY')} -{' '}
            {dayjs(CLOSE_DATE).format('MMM.DD, YYYY')}
          </p>
        </div>
        <div
          className={`${orbitron.className} flex w-full flex-col gap-1 sm:flex-row`}
        >
          <Button
            variant="secondary"
            className="w-full gap-3 rounded-xl px-5 text-base font-semibold text-[#1E293B]"
            onClick={(e) => {
              e.preventDefault();
              const grandPrizeElement = document.getElementById('grand-prize');
              if (grandPrizeElement) {
                const navbarHeight = 3.5 * 16;
                const extraSpacing = 20;
                const offsetTop =
                  grandPrizeElement.getBoundingClientRect().top +
                  window.scrollY -
                  navbarHeight -
                  extraSpacing;

                window.scrollTo({
                  top: offsetTop,
                  behavior: 'smooth',
                });
              }
            }}
          >
            <PulseIcon
              isPulsing={false}
              w={4}
              h={4}
              bg={'#808080'}
              text="#808080"
            />
            <span>Submissions Closed</span>
          </Button>
          <Button
            variant="ghost"
            className="hover:bg-secondary w-full rounded-xl text-base text-gray-300 underline"
            asChild
          >
            <Link href="https://t.me/+S_eelN_07xswYTdl" target="_blank">
              Find a Team
            </Link>
          </Button>
        </div>
      </div>
      <div className="relative mt-2 flex w-full max-w-[90%] flex-col overflow-hidden rounded-2xl border-[1.14px] border-white/50 md:absolute md:bottom-[-15%] md:mt-0 md:w-fit md:flex-row">
        <HeroMini START_DATE={START_DATE} CLOSE_DATE={CLOSE_DATE} />
      </div>
    </div>
  );
}

function HeroMini({
  START_DATE,
  CLOSE_DATE,
}: {
  START_DATE: string | Date;
  CLOSE_DATE: string | Date;
}) {
  const isMd = useBreakpoint('md');
  const [countdownDate, setCountdownDate] = useState<Date>(
    dayjs.utc(START_DATE).toDate(),
  );
  const [status, setStatus] = useState<'Start In' | 'Close In' | 'Closed'>(
    'Start In',
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

    const intervalId = setInterval(updateStatus, 1000);

    return () => clearInterval(intervalId);
  }, [START_DATE, CLOSE_DATE]);

  return (
    <>
      <ExternalImage
        src={baseAsset(isMd ? 'mini-banner' : 'mini-banner-mobile')}
        alt="mini banner"
        className="absolute top-0 left-0 h-full w-full overflow-hidden object-cover md:block"
      />
      <div
        className={`${orbitron.className} relative flex w-full items-center justify-center gap-8 rounded-md px-6 py-6 md:flex-row md:gap-12 md:rounded-xl md:px-40`}
      >
        <MiniStat
          title={'Total Prizes'}
          infotipContent="Prizes will be distributed as follows: 50% in stablecoins and 10% in $SONIC, both sent to winners immediately. The remaining 40% will be awarded as locked $SONIC tokens with a 12-month vesting period."
        >
          $1,000,000
        </MiniStat>

        <MiniStat className="" title={'Tracks'}>
          4
        </MiniStat>

        <MiniStat
          className="hidden"
          title={
            isMd ? `Submissions ${status}` : mobileTitleForCountdown(status)
          }
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
      </div>
    </>
  );
}

function mobileTitleForCountdown(status: 'Start In' | 'Close In' | 'Closed') {
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
  children: React.ReactNode;
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
          'flex flex-col items-start gap-0 md:items-start',
          className,
        )}
      >
        <span className="flex items-center gap-2">
          <p className="text-left text-sm font-medium text-gray-400 md:w-max md:text-base md:font-normal">
            {title}
          </p>
          {infotipContent && <Info className="h-3 w-3 text-gray-400" />}
        </span>
        <p className="text-xl font-medium md:text-3xl">{children}</p>
      </div>
    </Tooltip>
  );
}

function GrandPrize() {
  return (
    <div
      id="grand-prize"
      className="flex w-full flex-col gap-4 rounded-lg border border-slate-300 bg-indigo-50 p-3 md:flex-row md:p-4"
    >
      <div className="flex w-full items-center gap-5">
        <span className="flex min-h-[3.23rem] min-w-[3.23rem] items-center justify-center rounded-md bg-[#0F172B] md:min-h-[3.75rem] md:min-w-[3.75rem]">
          <Trophy className="min-h-8 min-w-8 text-white" />
        </span>
        <div className="flex h-full max-w-xl flex-col justify-between gap-0.5">
          <span className="text-sm font-semibold text-slate-900 md:text-base">
            Grand Prize
          </span>
          <span className="pr-0 text-xs leading-[0.85rem] font-medium text-slate-500 md:text-sm md:leading-[1.0625rem]">
            Up to four of the best overall projects across all tracks will be
            chosen by Mobius’ panel of top judges from the Solana ecosystem as
            the Grand Prize winners.
          </span>
        </div>
      </div>
      <div className="ml-auto flex w-max items-center justify-between gap-2 text-xl font-semibold md:text-2xl">
        <span className="text-slate-700">
          ${(400_000)?.toLocaleString('en-us')}{' '}
        </span>
        <span className="text-slate-400">USD</span>
      </div>
    </div>
  );
}

function Tracks() {
  return (
    <div className="mt-6 md:mt-8">
      <p className="mb-4 text-xl font-semibold">Submission Tracks</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tracks.map((t) => (
          <TrackBox {...t} key={t.slug} />
        ))}
      </div>
    </div>
  );
}

interface TrackProps {
  Icon: LucideIcon;
  title: string;
  subtext: string;
  sponsors: {
    name: string;
    src: string;
  }[];
  rewardAmount: number;
  slug: string;
}
const TrackBox = ({
  Icon,
  title,
  subtext,
  sponsors,
  rewardAmount,
  slug,
}: TrackProps) => {
  return (
    <Link
      href={`/earn/listing/${slug}`}
      className={cn('block rounded-lg border border-slate-200 p-3 md:p-4')}
    >
      <div className="flex items-center gap-5">
        <span className="flex min-h-[3.23rem] min-w-[3.23rem] items-center justify-center rounded-md bg-[#0F172B] md:min-h-[3.75rem] md:min-w-[3.75rem]">
          <Icon className="min-h-8 min-w-8 text-white" />
        </span>
        <div className="flex h-full max-w-lg flex-col justify-between gap-0.5">
          <span className="text-sm font-semibold text-slate-900 md:text-base">
            {title}
          </span>
          <span className="pr-0 text-xs leading-[0.95rem] font-medium text-slate-500 md:text-sm md:leading-[1.0625rem]">
            {subtext}
          </span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-2 md:mt-10">
        <div className="flex items-center gap-4 md:gap-6">
          <p className="text-sm font-medium">Sponsored by</p>
          <span className="flex flex-wrap items-center gap-2 md:gap-4">
            {sponsors.map((s) => (
              <>
                <ExternalImage
                  src={s.src || '/placeholder.svg'}
                  alt={s.name}
                  className="h-4 w-4 object-contain md:h-5 md:w-5"
                />
              </>
            ))}
          </span>
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-700 md:text-base">
            ${rewardAmount?.toLocaleString('en-us')}{' '}
          </span>
          <span className="text-sm font-semibold text-slate-400 md:text-base">
            USD
          </span>
        </div>
      </div>
    </Link>
  );
};

const faqs: { question: string; answer: string }[] = [
  {
    question: 'What is Sonic Mobius Hackathon?',
    answer:
      'Sonic Mobius Hackathon is hosted by SonicSVM and is the first SVM hackathon on Solana to empower builders to launch games and applications on Sonic.',
  },
  {
    question: 'Can I submit my final project without registering first?',
    answer:
      'We highly recommend all hackathon builders register before submitting their projects, as we’ll verify submissions against the registered Twitter/X account. However, if you’re unable to register, we’ll consider the submission details as final.',
  },
  {
    question: 'Can I submit multiple projects?',
    answer:
      'Yes, your team can submit projects to multiple tracks. However, each project is limited to one submission per track.',
  },
  {
    question: 'Can I submit my project to multiple tracks?',
    answer:
      'No, one project can only be submitted to one track. Please select the most relevant track at the submission page.',
  },
  {
    question: 'I want to participate but don’t have a team. What should I do?',
    answer:
      "You can join our <a href='https://t.me/+S_eelN_07xswYTdl' target='_blank'>Hackathon channel</a> and post a request to find teammates.",
  },
  {
    question: 'I have a team but no idea. What should I do?',
    answer:
      "Check out the <a href='https://www.notion.so/19a2d67d7b5f8091af6ad2957c575360?pvs=21' target='_blank'>idea board</a> or join the <a href='https://t.me/+S_eelN_07xswYTdl' target='_blank'>Hackathon channel</a> to discuss and brainstorm ideas.",
  },
];

function FAQs() {
  return (
    <div className="mt-4 flex flex-col items-center px-1 py-8 md:mt-8">
      <h2 className="pb-2 text-4xl font-bold md:text-5xl">FAQ</h2>
      <div className="w-full max-w-[35rem]">
        <Accordion type="single" collapsible>
          {faqs.map((f) => (
            <AccordionItem
              key={f.question}
              value={f.question}
              className="my-4 rounded-lg border shadow-md"
            >
              <AccordionTrigger className="rounded px-4 py-3 text-left font-normal text-slate-500 hover:bg-black/5 hover:no-underline focus:no-underline data-[state=open]:bg-black/5">
                <span className="flex-1 text-left text-sm sm:text-base">
                  {f.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-3 text-sm text-slate-700 sm:text-base [&_a]:text-blue-700">
                <div dangerouslySetInnerHTML={{ __html: f.answer }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({}) => {
  const hackathon = await prisma.hackathon.findUnique({
    where: {
      slug: 'mobius',
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
        deadline: hackathon?.deadline?.toISOString() || null,
        startDate: hackathon?.startDate?.toISOString() || null,
        announceDate: hackathon?.announceDate?.toISOString() || null,
        Sponsor: {
          ...hackathon.Sponsor,
          createdAt: hackathon?.Sponsor?.createdAt.toISOString() || null,
          updatedAt: hackathon?.Sponsor?.updatedAt.toISOString() || null,
        },
      },
    },
  };
};
