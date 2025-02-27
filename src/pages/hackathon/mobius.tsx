import type { Prisma } from '@prisma/client';
import {
  BarChartIcon as ChartNoAxesCombined,
  Brain,
  Gamepad2,
  type LucideIcon,
  Megaphone,
  Trophy,
} from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { Orbitron } from 'next/font/google';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
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
    slug: 'Attention-Capital-Market-Track',
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
    title: 'Defi Track',
    subtext:
      'Asset launchpad, trading bot, yield generating, lending, MEV, etc.',
    slug: 'defi-track',
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
    slug: 'ai-track',
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
    slug: 'gaming-track',
    rewardAmount: 150_000,
    sponsors: [
      {
        name: 'Send Arcade',
        src: baseAsset('send-arcade'),
      },
    ],
  },
];

type Hackathon = Prisma.HackathonGetPayload<{
  include: {
    Sponsor: true;
  };
}>;
export default function Mobius({ hackathon }: { hackathon: Hackathon }) {
  if (!hackathon.startDate || !hackathon.deadline)
    throw new Error('Start Date and deadline missing');
  const START_DATE = hackathon.startDate;
  const CLOSE_DATE = hackathon.deadline;

  const [hackathonIsOn, setHackathonIsOn] = useState(false);
  useEffect(() => {
    const hackathonStartTime = dayjs(START_DATE);

    const checkHackathonStatus = () => {
      const now = dayjs.utc();
      if (now.isAfter(hackathonStartTime)) {
        setHackathonIsOn(true);
      }
    };

    checkHackathonStatus();

    const intervalId = setInterval(checkHackathonStatus, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Sonic Mobius | Superteam Earn"
          description={`Join the first-ever SVM hackathon on Solana – Sonic Mobius Hackathon – with a $1,000,000 prize pool! Build, launch on Sonic SVM Mainnet, and onboard the next billion users.`}
          canonical="https://earn.superteam.fun/hackathon/mobius"
        />
      }
    >
      <Hero START_DATE={START_DATE} CLOSE_DATE={CLOSE_DATE} />
      <div className="mx-auto mt-5 w-full max-w-5xl px-4 md:mt-24">
        <GrandPrize />
        <Tracks isHackathonOn={hackathonIsOn} />
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
      className="relative flex w-full flex-col items-center border-b border-slate-200 bg-cover bg-center bg-no-repeat pb-6 pt-8 text-center text-white md:pb-20"
      style={{
        backgroundImage: `url('${ASSET_URL + baseAsset(isMd ? 'banner' : 'banner-mobile')}')`,
      }}
    >
      <ExternalImage alt="Sonic" src={baseAsset('sonic')} className="w-28" />
      <p
        className={`${orbitron.className} px-6 text-[2.5rem] font-medium leading-none md:mt-2 md:font-normal`}
      >
        Sonic Mobius Hackathon
      </p>
      <p
        className={`${orbitron.className} mt-3 px-6 md:mt-2 md:text-lg md:font-medium`}
      >
        The first SVM hackathon on Solana
      </p>
      <div className="mb-1 mt-12 flex flex-col items-center gap-6 md:mt-6">
        <div className={`${orbitron.className}`}>
          <p className="font-medium">
            {dayjs(START_DATE).format('MMM.DD, YYYY')} -{' '}
            {dayjs(CLOSE_DATE).format('MMM.DD, YYYY')}
          </p>
        </div>
        <div
          className={`${orbitron.className} flex w-full flex-col gap-2 sm:flex-row`}
        >
          <Button
            variant="secondary"
            className="w-full rounded-xl text-base text-[#1E5871]"
            asChild
          >
            <Link
              href="https://sonicsvm.typeform.com/mobiushackathon"
              target="_blank"
            >
              Register Now
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-xl text-base text-gray-300 underline hover:bg-secondary"
            asChild
          >
            <Link href="https://t.me/+S_eelN_07xswYTdl" target="_blank">
              Find a Team
            </Link>
          </Button>
        </div>
      </div>
      <div className="relative mt-2 flex w-full max-w-[90%] flex-col overflow-hidden rounded-2xl border-[1.14px] border-white/50 md:absolute md:bottom-[-20%] md:mt-0 md:w-fit md:flex-row">
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
  const [status, setStatus] = useState<'Open In' | 'Close In' | 'Closed'>(
    'Open In',
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
  }, []);

  return (
    <>
      <ExternalImage
        src={baseAsset(isMd ? 'mini-banner' : 'mini-banner-mobile')}
        alt="mini banner"
        className="absolute left-0 top-0 h-full w-full overflow-hidden object-cover md:block"
      />
      <div
        className={`${orbitron.className} relative flex w-full items-center justify-center gap-8 rounded-md px-6 py-6 md:flex-row md:gap-12 md:rounded-xl md:px-16`}
      >
        <MiniStat title={'Total Prizes'}>$1,000,000</MiniStat>

        <MiniStat className="hidden md:flex" title={'Tracks'}>
          4
        </MiniStat>

        <MiniStat title={`Submissions ${status}`}>
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

function MiniStat({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-0 md:items-start',
        className,
      )}
    >
      <p className="text-left text-sm font-medium text-gray-400 md:w-max md:text-base md:font-normal">
        {title}
      </p>
      <p className="text-xl font-medium md:text-3xl">{children}</p>
    </div>
  );
}

function GrandPrize() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-slate-300 bg-indigo-50 p-3 md:flex-row md:p-4">
      <div className="flex w-full items-center gap-4">
        <span className="flex min-h-14 min-w-14 items-center justify-center rounded-md bg-[#0F172B]">
          <Trophy className="min-h-8 min-w-8 text-white" />
        </span>
        <div className="flex h-full max-w-lg flex-col justify-between gap-1">
          <span className="text-sm font-semibold text-slate-900 md:text-base">
            Grand Prize
          </span>
          <span className="text-sm font-medium leading-[1.1] text-slate-500">
            The best overall projects across all tracks, receiving recognition
            from both judges and the community.
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

function Tracks({ isHackathonOn }: { isHackathonOn: boolean }) {
  return (
    <div className="mt-6 md:mt-8">
      <p className="mb-4 text-xl font-semibold">Submission Tracks</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tracks.map((t) => (
          <TrackBox {...t} key={t.slug} isHackathonOn={isHackathonOn} />
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
  isHackathonOn?: boolean;
}
const TrackBox = ({
  Icon,
  title,
  subtext,
  sponsors,
  rewardAmount,
  slug,
  isHackathonOn,
}: TrackProps) => {
  return (
    <Link
      href={isHackathonOn ? `/listing/${slug}` : '#'}
      className={cn(
        'block rounded-lg border border-slate-200 p-3 md:p-4',
        !isHackathonOn && 'pointer-events-none',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex min-h-14 min-w-14 items-center justify-center rounded-md bg-[#0F172B]">
          <Icon className="min-h-8 min-w-8 text-white" />
        </span>
        <div className="flex h-full max-w-lg flex-col justify-between gap-1">
          <span className="text-sm font-semibold text-slate-900 md:text-base">
            {title}
          </span>
          <span className="text-sm font-medium leading-[1.1] text-slate-500">
            {subtext}
          </span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-2 md:mt-10">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">Sponsored by</p>
          <span className="flex flex-wrap items-center gap-4">
            {sponsors.map((s) => (
              <>
                <ExternalImage
                  src={s.src || '/placeholder.svg'}
                  alt={s.name}
                  className="h-5 w-5 object-contain"
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
      ' Sonic Mobius Hackathon is the first SVM hackathon, designed for the multi-SVM universe. Builders can participate and launch on Sonic SVM Mainnet, the first SVM to launch on Solana for games and applications.',
  },
  {
    question: 'Can I submit my final project without registering first?',
    answer:
      'You can submit even if you did not register for this hackathon. However, the Sonic team highly recommends all participants to register before submitting their projects, as the team will verify the submissions against the registered Twitter/X account.',
  },
  {
    question: 'Can I submit multiple projects?',
    answer:
      'No, each builder can only submit one project and be part of one team.',
  },
  {
    question: 'I want to participate but don’t have a team. What should I do?',
    answer: `You can join our <a href='https://t.me/+S_eelN_07xswYTdl' target='_blank'>Hackathon channel</a> and post a request to find teammates.`,
  },
  {
    question: 'I have a team but no idea. What should I do?',
    answer:
      "Check out the <a href='https://www.notion.so/mirrorworldfun/Sonic-Mobius-Hackathon-Ideaboard-19a2d67d7b5f8091af6ad2957c575360' target='_blank'>Idea board</a> or join the <a href='https://t.me/+S_eelN_07xswYTdl' target='_blank'>Hackathon channel</a> to discuss and brainstorm ideas.",
  },
];

function FAQs() {
  return (
    <div className="mt-4 flex flex-col items-center px-4 py-8 md:mt-8">
      <h2 className="pb-2 text-4xl font-bold md:text-5xl">FAQ</h2>
      <div className="w-full max-w-[35rem]">
        <Accordion type="single" collapsible>
          {faqs.map((f) => (
            <AccordionItem
              key={f.question}
              value={f.question}
              className="my-4 rounded-lg border shadow-md"
            >
              <AccordionTrigger className="rounded px-4 py-3 text-left font-normal text-slate-500 data-[state=open]:bg-black/5 hover:bg-black/5 hover:no-underline focus:no-underline">
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
