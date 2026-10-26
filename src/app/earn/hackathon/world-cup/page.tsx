import 'server-only';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { pageMetadata } from '@/lib/metadata';

import { loadHackathon, loadStats, loadTracks } from '../hackathon-data';
import { WorldCupView } from './world-cup-view';

const WORLD_CUP_OG_IMAGE = `${ASSET_URL}/hackathon/world-cup/og.png`;

const SLUG = 'world-cup';

export const metadata = pageMetadata({
  title: 'World Cup Hackathon | Superteam Earn',
  description:
    'A World Cup hackathon for builders creating real-time match data, trading agents, prediction markets, and fan experiences.',
  canonical: 'https://superteam.fun/earn/hackathon/world-cup/',
  og: WORLD_CUP_OG_IMAGE,
});

export default async function Page() {
  const [hackathon, trackData, stats] = await Promise.all([
    loadHackathon(SLUG),
    loadTracks(SLUG),
    loadStats(SLUG),
  ]);
  return (
    <WorldCupView
      hackathon={hackathon}
      trackData={trackData ?? undefined}
      stats={stats ?? undefined}
    />
  );
}
