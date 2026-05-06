import { QueryClient, dehydrate, useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { JsonLd } from '@/components/shared/JsonLd';
import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { statsDataQuery, trackDataQuery } from '@/queries/hackathon';
import { RenaissanceLogo } from '@/svg/renaissance-logo';
import { generateBreadcrumbListSchema } from '@/utils/json-ld';

export default function Renaissance() {
  const slug = 'renaissance';

  const { data: trackData } = useQuery(trackDataQuery(slug));
  const { data: stats } = useQuery(statsDataQuery(slug));

  return (
    <Default
      className="bg-white"
      meta={
        <>
          <Meta
            title="Renaissance — Submission Tracks | Superteam Earn"
            description="Submit to bounty tracks of the Renaissance content hackathon on Superteam Earn. Solana's first-ever content hackathon — earn crypto for writing, design, and more."
            canonical="https://superteam.fun/earn/hackathon/renaissance/"
          />
          <JsonLd
            data={[
              generateBreadcrumbListSchema([
                { name: 'Home', url: '/' },
                { name: 'Hackathons', url: '/hackathon/all/' },
                { name: 'Renaissance' },
              ]),
              {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: 'Renaissance — Solana Content Hackathon',
                description:
                  "Submit to bounty tracks of the Renaissance content hackathon on Superteam Earn. Solana's first-ever content hackathon — earn crypto for writing, design, and more.",
                url: 'https://superteam.fun/earn/hackathon/renaissance/',
                organizer: {
                  '@type': 'Organization',
                  name: 'Superteam Earn',
                  url: 'https://superteam.fun/',
                },
              },
            ]}
          />
        </>
      }
    >
      <div>
        <div
          className="flex flex-col items-center border-b border-slate-200 bg-cover bg-center bg-no-repeat pt-12"
          style={{
            backgroundImage: `url('${ASSET_URL}/hackathon/renaissance/bg.png')`,
          }}
        >
          <RenaissanceLogo styles={{ height: '80px', width: 'auto' }} />
          <p className="mt-4 px-6 text-center text-slate-600">
            Participate in Solana&apos;s first ever content hackathon
          </p>
          <div className="flex items-center gap-6">
            <Button
              className="my-6 rounded-full bg-[#A8EAFF] px-6 py-4 text-sm text-black hover:bg-[#716f6e] hover:text-white"
              onClick={() =>
                window.open(
                  'https://airtable.com/appTNIj7RXgv7Txbt/shrh4eZOkeDDFBCOH',
                  '_blank',
                )
              }
            >
              Sponsor a Track
            </Button>

            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
              <p className="text-sm font-medium">Submissions Closed</p>
            </div>
          </div>
          <div className="flex justify-center gap-4 px-6 pb-6 md:gap-12">
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
                  date={new Date('2024-04-10T11:59:59Z')}
                  renderer={CountDownRenderer}
                  zeroPadDays={1}
                />
              </p>
            </div>
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

export const getServerSideProps: GetServerSideProps = async () => {
  const slug = 'renaissance';
  const queryClient = new QueryClient();

  const hackathon = await prisma.hackathon.findUnique({ where: { slug } });

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['tracks', slug],
      queryFn: async () => {
        const result = await prisma.bounties.findMany({
          where: { Hackathon: { slug }, isPublished: true },
          select: {
            title: true,
            token: true,
            rewardAmount: true,
            slug: true,
            sponsor: {
              select: {
                name: true,
                slug: true,
                logo: true,
                isVerified: true,
                chapter: { select: { id: true } },
              },
            },
          },
          orderBy: { usdValue: 'desc' },
        });
        return JSON.parse(JSON.stringify(result));
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ['stats', slug],
      queryFn: async () => {
        if (!hackathon)
          return {
            totalRewardAmount: 0,
            totalListings: 0,
            deadline: null,
            startDate: null,
            announceDate: null,
          };
        const [totalListings, totalRewardAmount] = await Promise.all([
          prisma.bounties.count({
            where: {
              hackathonId: hackathon.id,
              isActive: true,
              isArchived: false,
              status: 'OPEN',
              isPublished: true,
            },
          }),
          prisma.bounties.aggregate({
            _sum: { usdValue: true },
            where: {
              hackathonId: hackathon.id,
              isActive: true,
              isArchived: false,
              status: 'OPEN',
              isPublished: true,
            },
          }),
        ]);
        return JSON.parse(
          JSON.stringify({
            totalRewardAmount: totalRewardAmount._sum.usdValue || 0,
            totalListings,
            deadline: hackathon.deadline,
            startDate: hackathon.startDate,
            announceDate: hackathon.announceDate,
          }),
        );
      },
    }),
  ]);

  return {
    props: {
      dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
    },
  };
};
