import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import { Outfit } from 'next/font/google';
import { useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { type HackathonGetPayload } from '@/prisma/models/Hackathon';
import { statsDataQuery, trackDataQuery } from '@/queries/hackathon';
import { RedactedLogo } from '@/svg/redacted';
import { dayjs } from '@/utils/dayjs';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

type Hackathon = HackathonGetPayload<{
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
            content={`https://res.cloudinary.com/dgvnuwspr/image/upload/v1741616337/assets/hackathon/redacted/redacted-og`}
          />
          <Meta
            title="Helius [REDACTED] Hackathon | Superteam Earn"
            description="Join the Helius Hackathon—a data-driven challenge empowering analysts, data scientists, and on-chain sleuths to expose fraud, build insightful dashboards, and advance Solana’s social layer."
            canonical="https://superteam.fun/earn/hackathon/redacted/"
            og="https://res.cloudinary.com/dgvnuwspr/image/upload/v1741616337/assets/hackathon/redacted/redacted-og"
          />
        </>
      }
    >
      <div>
        <div
          className="flex flex-col items-center border-b border-slate-200 bg-cover bg-center bg-no-repeat pt-20 pb-12"
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
              {dayjs.utc(START_DATE).format('MMM.DD')} to{' '}
              {dayjs.utc(CLOSE_DATE).format('MMM.DD, YYYY')} (UTC)
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
              {trackData?.map((track) => (
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
