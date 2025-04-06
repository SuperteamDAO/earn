import type { Prisma } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { type TrackProps } from '@/interface/hackathon';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import {
  type Stats,
  statsDataQuery,
  trackDataQuery,
} from '@/queries/hackathon';
import { BreakoutLogo } from '@/svg/breakout-logo';
import { PulseIcon } from '@/svg/pulse-icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

const animeAce = localFont({
  src: [
    {
      path: '../../theme/animeace2_reg.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../theme/animeace2_reg.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../theme/animeace2_ital.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../theme/animeace2_ital.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../theme/animeace2_bld.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../theme/animeace2_bld.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
});

const base = `/hackathon/breakout/`;
const baseAsset = (filename: string) => base + filename;

type Hackathon = Prisma.HackathonGetPayload<{
  include: {
    Sponsor: true;
  };
}>;
export default function Breakout({ hackathon }: { hackathon: Hackathon }) {
  const slug = 'breakout';
  if (!hackathon.startDate || !hackathon.deadline)
    throw new Error('Start Date and deadline missing');
  const START_DATE = hackathon.startDate;
  const CLOSE_DATE = hackathon.deadline;

  const { data: trackData } = useQuery(trackDataQuery(slug));
  const { data: stats } = useQuery(statsDataQuery(slug));

  return (
    <Default
      className="bg-white"
      meta={
        <>
          <meta
            name="twitter:image"
            content={`https://res.cloudinary.com/dgvnuwspr/image/upload/v1740832046/assets/hackathon/breakout/og-image`}
          />
          <Meta
            title="Breakout | Superteam Earn"
            description={`Solana Breakout Online Hackathon`}
            canonical="https://earn.superteam.fun/hackathon/breakout"
            og="https://res.cloudinary.com/dgvnuwspr/image/upload/v1740832046/assets/hackathon/breakout/og-image"
          />
        </>
      }
    >
      <Hero stats={stats} START_DATE={START_DATE} CLOSE_DATE={CLOSE_DATE} />
      <div className="mx-auto mt-20 mb-20 w-full max-w-7xl px-4 md:mt-24 xl:mt-28">
        <Tracks tracks={trackData} />
        {/* <FAQs /> */}
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
  const isSM = useBreakpoint('sm');
  const [status, setStatus] = useState<'Start In' | 'Close In' | 'Closed'>(
    'Start In',
  );

  useEffect(() => {
    function updateStatus() {
      if (dayjs().isAfter(dayjs(CLOSE_DATE))) {
        setStatus('Closed');
      } else if (dayjs().isAfter(dayjs(START_DATE))) {
        setStatus('Close In');
      }
    }

    const intervalId = setInterval(updateStatus, 1000);

    return () => clearInterval(intervalId);
  }, [START_DATE, CLOSE_DATE]);
  return (
    <div
      className="relative flex w-full flex-col items-center border-b border-slate-200 bg-cover bg-center bg-no-repeat pt-8 pb-20 text-center text-white"
      style={{
        backgroundImage: `url('${ASSET_URL + baseAsset(isSM ? 'banner' : 'banner-mobile')}')`,
      }}
    >
      <BreakoutLogo />
      <div className="mt-4 mb-1 flex w-full max-w-[18.5rem] flex-col items-center gap-4 text-black sm:w-auto sm:max-w-none">
        <div className={`${animeAce.className} italic`}>
          <p className="font-medium">
            Submissions Due {dayjs(CLOSE_DATE).format('MMM DD, YYYY')}
          </p>
        </div>
        <div className={`flex w-full flex-col gap-1 sm:flex-row`}>
          <Button
            variant="secondary"
            className="w-full rounded-full bg-black px-5 text-base text-white hover:bg-slate-700"
            asChild
          >
            <Link href="#" target="_blank">
              Find Ideas to Build
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-3 rounded-full px-5 text-base font-medium hover:bg-slate-200"
          >
            {status === 'Close In' && (
              <PulseIcon
                isPulsing={true}
                w={4}
                h={4}
                bg={'#9AE6B4'}
                text="#16A34A"
              />
            )}
            {status === 'Start In' && 'Submissions Open Soon'}
            {status === 'Close In' && 'Submissions Open'}
            {status === 'Closed' && 'Submissions Closed'}
          </Button>
        </div>
      </div>
      <div className="absolute bottom-[-12%] mt-0 flex w-full max-w-[90%] flex-row overflow-hidden rounded-2xl border-[1.14px] border-white/50 md:w-fit">
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
  const [status, setStatus] = useState<'Start In' | 'Close In' | 'Closed'>(
    'Start In',
  );

  useEffect(() => {
    console.log('start date', START_DATE);
    console.log('close date', CLOSE_DATE);
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
      <div
        className={`${animeAce.className} relative flex w-full items-center justify-center gap-8 rounded-md bg-black px-6 py-6 md:flex-row md:gap-12 md:rounded-xl md:px-16`}
      >
        <MiniStat title={'Total Prizes'}>
          ${stats?.totalRewardAmount.toLocaleString('en-us') ?? '-'}
        </MiniStat>

        <MiniStat className="hidden sm:flex" title={'Tracks'}>
          {stats?.totalListings ?? '-'}
        </MiniStat>

        <MiniStat
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
          'flex flex-col items-start gap-1 md:items-start',
          className,
        )}
      >
        <span className="flex items-center gap-2">
          <p className="text-left text-xs text-gray-400 md:w-max md:text-sm">
            {title}
          </p>
          {infotipContent && <Info className="h-3 w-3 text-gray-400" />}
        </span>
        <p className="text-lg font-bold md:text-xl">{children}</p>
      </div>
    </Tooltip>
  );
}

function Tracks({ tracks }: { tracks: TrackProps[] | undefined }) {
  return (
    <div className="mx-6">
      <div className="mx-auto max-w-7xl py-6">
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

// const faqs: { question: string; answer: string }[] = [];

// function FAQs() {
//   return (
//     <div className="mt-4 flex flex-col items-center px-1 py-8 md:mt-8">
//       <h2 className="pb-2 text-4xl font-bold md:text-5xl">FAQ</h2>
//       <div className="w-full max-w-[35rem]">
//         <Accordion type="single" collapsible>
//           {faqs.map((f) => (
//             <AccordionItem
//               key={f.question}
//               value={f.question}
//               className="my-4 rounded-lg border shadow-md"
//             >
//               <AccordionTrigger className="rounded px-4 py-3 text-left font-normal text-slate-500 hover:bg-black/5 hover:no-underline focus:no-underline data-[state=open]:bg-black/5">
//                 <span className="flex-1 text-left text-sm sm:text-base">
//                   {f.question}
//                 </span>
//               </AccordionTrigger>
//               <AccordionContent className="px-4 pt-3 text-sm text-slate-700 sm:text-base [&_a]:text-blue-700">
//                 <div dangerouslySetInnerHTML={{ __html: f.answer }} />
//               </AccordionContent>
//             </AccordionItem>
//           ))}
//         </Accordion>
//       </div>
//     </div>
//   );
// }

export const getServerSideProps: GetServerSideProps = async ({}) => {
  const hackathon = await prisma.hackathon.findUnique({
    where: {
      slug: 'breakout',
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
