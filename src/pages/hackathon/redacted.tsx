import { type Prisma } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'isomorphic-dompurify';
import { type GetServerSideProps } from 'next';
import { Outfit } from 'next/font/google';
import React, { useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { statsDataQuery, trackDataQuery } from '@/queries/hackathon';
import { RedactedLogo } from '@/svg/redacted';
import { dayjs } from '@/utils/dayjs';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

type Hackathon = Prisma.HackathonGetPayload<{
  include: {
    Sponsor: true;
  };
}>;
export default function Redacted({ hackathon }: { hackathon: Hackathon }) {
  const slug = 'redacted';

  const { data: trackData } = useQuery(trackDataQuery(slug));
  const { data: stats } = useQuery(statsDataQuery(slug));

  const START_DATE = hackathon.startDate;
  const CLOSE_DATE = hackathon.deadline;

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
    <Default
      className="bg-white"
      meta={
        <>
          <meta
            name="twitter:image"
            content={`https://res.cloudinary.com/dgvnuwspr/image/upload/v1741616337/assets/hackathon/redacted/redacted-og.png`}
          />
          <Meta
            title="Helius [Redacted] Hackathon | Superteam Earn"
            description="Join the Helius Hackathon—a data-driven challenge empowering analysts, data scientists, and on-chain sleuths to expose fraud, build insightful dashboards, and advance Solana’s social layer."
            canonical="https://earn.superteam.fun/hackathon/redacted"
            og="https://res.cloudinary.com/dgvnuwspr/image/upload/v1741616337/assets/hackathon/redacted/redacted-og.png"
          />
        </>
      }
    >
      <div>
        <div
          className="flex flex-col items-center border-b border-slate-200 bg-cover bg-center bg-no-repeat pb-12 pt-20"
          style={{
            backgroundImage: `url('${ASSET_URL}/hackathon/redacted/banner')`,
          }}
        >
          <RedactedLogo
            className="h-[4.5rem] w-auto md:h-[7.125rem]"
            variant="#DBDBDB"
          />
          <div
            className={`max-w-xl px-6 text-center font-medium text-white drop-shadow-xl md:text-lg ${outfit.className}`}
          >
            <p className="">
              {dayjs(START_DATE).format('MMM.DD, YYYY')} -{' '}
              {dayjs(CLOSE_DATE).format('MMM.DD, YYYY')}
            </p>
            <p className="mt-4 md:text-xl">
              Strengthen Solana’s social layer by{' '}
              <span className="text-orange-500">uncovering</span> and reporting
              fake activity and fraud
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-4 px-6 py-6 md:gap-12">
          <div className="flex flex-col">
            <p className="text-sm font-medium">Total Prizes</p>
            <p className="text-xl font-semibold text-slate-800 md:text-2xl">
              ${stats?.totalRewardAmount.toLocaleString('en-us') ?? '-'}
            </p>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium">Tracks</p>
            <p className="text-xl font-semibold text-slate-800 md:text-2xl">
              {stats?.totalListings ?? '-'}
            </p>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium">Submissions {status}</p>
            <p className="text-xl font-semibold text-slate-800 md:text-2xl">
              {status !== 'Closed' ? (
                <Countdown
                  date={countdownDate}
                  renderer={CountDownRenderer}
                  zeroPadDays={1}
                />
              ) : (
                '-'
              )}
            </p>
          </div>
        </div>
        <div className="mx-6">
          <div className="mx-auto max-w-7xl py-6">
            <p className="mb-4 text-lg font-semibold text-slate-900 md:text-xl">
              Submission Tracks
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trackData?.map((track, index) => (
                <TrackBox
                  key={index}
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
        <div>
          <FAQs />
        </div>
      </div>
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async ({}) => {
  const hackathon = await prisma.hackathon.findUnique({
    where: {
      slug: 'redacted',
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

const faqs: { question: string; answer: string }[] = [
  {
    question: 'What is the [REDACTED] Hackathon?',
    answer: `The [REDACTED] Hackathon by <a target='_blank' href='https://www.helius.dev/'>Helius</a> is a virtual Solana event centered on on-chain forensics, security, data transparency, and real-time monitoring.`,
  },
  {
    question: 'Who can participate?',
    answer: 'Everyone is welcome and encouraged to participate.',
  },
  {
    question: 'How do I enter a submission?',
    answer:
      "Every bounty page has a “Submit Now” button where participants can submit their entry. Use this button to enter your submission. Before submitting your entry, re-read the bounty's eligibility criteria and submission requirements to make sure your entry follows all of the rules.",
  },
  {
    question: 'Can I submit entries to multiple bounties?',
    answer:
      'Yes, participants may submit entries to multiple bounties. All bounties must be submitted before the 1-month submission deadline ends.',
  },
  {
    question: 'How are winners chosen?',
    answer:
      'Bounty sponsors are responsible for choosing winners for each bounty based on the bounty’s description, judgement criteria, and submission guidelines. After the 1-month submission period ends, bounty sponsors have two weeks to review all of the submissions and select winners. The decision of the sponsors when it comes to picking the winners of their bounties will be final.<br /><br /> <strong>Note:</strong> Pay attention to the judgement criteria and submission guidelines to avoid a situation where your submission is disqualified for failing to meet the bounty’s rules.',
  },
  {
    question: 'How are winners paid?',
    answer:
      'Winners are paid directly by the bounty sponsor. Sponsors have two weeks after the judgment period to remit payments to winners. Winners can receive payments through the wallet connected to their Superteam account, or through an external wallet.',
  },
  {
    question: 'I have questions. Who should I contact?',
    answer:
      'For general questions, join this public <a href="https://t.me/redacted_hackathon" target="_blank">Telegram group</a>. If your question is specific to a particular bounty, please use the "Reach Out" link of the bounty listing page or reach out to the bounty’s sponsor directly through other channels. All sponsors should have a public Discord, Telegram, or X account where you can ask questions. If you’re unable to get in touch with the bounty’s sponsor, please ask <a href="https://t.me/bradyowen" target="_blank">@bradyowen</a> in the public Telegram group for help.',
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
              <AccordionTrigger className="rounded px-4 py-3 text-left font-normal text-slate-500 data-[state=open]:bg-black/5 hover:bg-black/5 hover:no-underline focus:no-underline">
                <span className="flex-1 text-left text-sm sm:text-base">
                  {f.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-3 text-sm text-slate-700 sm:text-base [&_a]:text-blue-700">
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(f.answer, {
                      ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em'],
                      ALLOWED_ATTR: ['href', 'target', 'rel'],
                    }),
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
