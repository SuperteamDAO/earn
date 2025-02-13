import { useQuery } from '@tanstack/react-query';
import React from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { CHAIN_NAME, PROJECT_NAME } from '@/constants/project';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { statsDataQuery, trackDataQuery } from '@/queries/hackathon';
import { ScribesLogo } from '@/svg/scribes-logo';
import { getURL } from '@/utils/validUrl';

export default function Scribes() {
  const slug = 'scribes';

  const { data: trackData } = useQuery(trackDataQuery(slug));
  const { data: stats } = useQuery(statsDataQuery(slug));

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title={`${CHAIN_NAME} Scribes | ${PROJECT_NAME}`}
          description={`Explore the latest bounties on ${PROJECT_NAME}, offering opportunities in the crypto space across Design, Development, and Content.`}
          canonical={`${getURL()}/hackathon/${slug}`}
        />
      }
    >
      <div>
        <div
          className="flex flex-col items-center border-b border-slate-200 bg-cover bg-center bg-no-repeat pt-12"
          style={{
            backgroundImage: `url('${ASSET_URL}/hackathon/scribes/scribes-bg.png')`,
          }}
        >
          <p className="mb-4 font-mono">Lamport DAO presents</p>
          <ScribesLogo styles={{ height: '80px', width: 'auto' }} />
          <p className="mt-4 px-6 text-center text-slate-600">
            Participate in {CHAIN_NAME}&apos;s first ever content hackathon
          </p>
        </div>
        <div className="flex justify-center gap-4 px-6 py-6 md:gap-12">
          <div className="flex flex-col">
            <p className="text-sm font-medium">Total Prizes</p>
            <p className="text-xl font-semibold text-slate-800 md:text-2xl">
              ${stats?.totalRewardAmount.toLocaleString('en-us')}
            </p>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium">Tracks</p>
            <p className="text-xl font-semibold text-slate-800 md:text-2xl">
              {stats?.totalListings}
            </p>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium">Submissions End In</p>
            <p className="text-xl font-semibold text-slate-800 md:text-2xl">
              <Countdown
                date={new Date('2024-02-29T23:59:59Z')}
                renderer={CountDownRenderer}
                zeroPadDays={1}
              />
            </p>
          </div>
        </div>
        <div className="mx-6">
          <div className="mx-auto max-w-7xl py-6">
            <p className="mb-4 text-xl font-semibold text-slate-900">Tracks</p>
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
      </div>
    </Default>
  );
}
