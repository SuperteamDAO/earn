import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { statsDataQuery, trackDataQuery } from '@/queries/hackathon';
import { RadarLogo } from '@/svg/radar-logo';

export default function Radar() {
  const slug = 'radar';
  const startDate = '2024-10-02T00:00:00.000Z';
  const deadline = '2024-10-10T00:00:00.000Z';

  const now = new Date();
  const startTime = new Date(startDate);
  const endTime = new Date(deadline);

  const getSubmissionStatus = () => {
    if (now < startTime) {
      return { text: 'Submissions Open Soon', colorClass: 'bg-gray-500' };
    } else if (now >= startTime && now < endTime) {
      return { text: 'Submissions Open', colorClass: 'bg-green-500' };
    }
    return { text: 'Submissions Closed', colorClass: 'bg-gray-500' };
  };

  const getCountdownText = () =>
    now < startTime ? 'Submissions Open In' : 'Submissions Close In';
  const getCountdownDate = () => (now < startTime ? startTime : endTime);

  const submissionStatus = getSubmissionStatus();
  const countdownText = getCountdownText();
  const countdownDate = getCountdownDate();

  const { data: trackData, isLoading: isTracksLoading } = useQuery(
    trackDataQuery(slug),
  );
  const { data: stats, isLoading: isStatsLoading } = useQuery(
    statsDataQuery(slug),
  );

  const sortedTrackData = useMemo(() => {
    if (!trackData) return [];
    const superteamTracks = trackData.filter((track) => track.sponsor.st);
    const otherTracks = trackData.filter((track) => !track.sponsor.st);
    return [...otherTracks, ...superteamTracks];
  }, [trackData]);

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Radar | Superteam Earn"
          description="Build a project for the latest Solana global hackathon!"
          canonical="https://earn.superteam.fun"
          og={ASSET_URL + `/og/hackathon/${slug}.png`}
        />
      }
    >
      <div className="animate-fadeIn">
        <div
          className="flex flex-col items-center border-b border-slate-200 bg-cover bg-center bg-no-repeat pt-12"
          style={{
            backgroundImage: `url('${ASSET_URL}/hackathon/radar/bg.webp')`,
          }}
        >
          <div className="animate-slideDown">
            <RadarLogo styles={{ height: '5.5rem', width: 'auto' }} />
          </div>

          <p className="mt-1 max-w-[28rem] px-6 text-center text-lg text-[#AAA199]">
            Submit to exclusive tracks of the latest Solana Global Hackathon on
            Earn
          </p>

          <div className="flex items-center gap-6">
            <Button
              className="my-6 rounded-full bg-[#E6B22D] px-6 py-4 text-sm text-black hover:bg-yellow-600 hover:text-white"
              onClick={() =>
                window.open(
                  'https://build.superteam.fun/ideas?utm_source=superteamearn&utm_campaign=radar',
                  '_blank',
                )
              }
            >
              Find Ideas to Build
            </Button>

            <div className="flex items-center gap-1">
              <div
                className={`h-2.5 w-2.5 rounded-full ${submissionStatus.colorClass}`}
              />
              <p className="text-sm font-medium text-gray-100">
                {submissionStatus.text}
              </p>
            </div>
          </div>

          <div
            className={`flex justify-center gap-4 px-6 pt-4 pb-12 text-gray-100 md:gap-12 ${isStatsLoading ? 'invisible' : 'visible'}`}
          >
            <div className="flex flex-col">
              <p className="text-sm font-medium text-orange-100">
                Total Prizes
              </p>
              <p className="text-xl font-semibold md:text-2xl">
                $
                {stats?.totalRewardAmount.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-orange-100">Tracks</p>
              <p className="text-xl font-semibold md:text-2xl">
                {stats?.totalListings}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-orange-100">
                {countdownText}
              </p>
              <p className="text-xl font-semibold md:text-2xl">
                <Countdown
                  date={countdownDate}
                  renderer={CountDownRenderer}
                  zeroPadDays={1}
                />
              </p>
            </div>
          </div>
        </div>

        <div className="mx-6">
          <div className="mx-auto max-w-7xl py-6">
            <p
              className={`mb-4 text-xl font-semibold text-slate-900 ${isTracksLoading ? 'invisible' : 'visible'}`}
            >
              Submission Tracks
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedTrackData?.map((track, index) => (
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
