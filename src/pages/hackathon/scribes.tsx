import { useQuery } from '@tanstack/react-query';
import React from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { statsDataQuery, trackDataQuery } from '@/queries/hackathon';
import { ScribesLogo } from '@/svg/scribes-logo';

export default function Scribes() {
  const slug = 'scribes';

  const { data: trackData } = useQuery(trackDataQuery(slug));
  const { data: stats } = useQuery(statsDataQuery(slug));

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Solana Scribes | Superteam Earn"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
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
            Participate in Solana&apos;s first ever content hackathon
          </p>
          <div className="flex pb-4">
            <Button
              className="my-6 rounded-full bg-black py-4 text-sm hover:bg-[#a459ff]"
              onClick={() =>
                window.open('https://discord.gg/solanacollective', '_blank')
              }
            >
              Join Solana Collective&apos;s Discord
            </Button>
          </div>
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
