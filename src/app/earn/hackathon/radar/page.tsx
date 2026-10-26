import 'server-only';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { pageMetadata } from '@/lib/metadata';

import { loadStats, loadTracks } from '../hackathon-data';
import { RadarView } from './radar-view';

const SLUG = 'radar';

export const metadata = pageMetadata({
  title: 'Radar | Superteam Earn',
  description: 'Build a project for the latest Solana global hackathon!',
  canonical: 'https://superteam.fun/earn/hackathon/radar/',
  og: `${ASSET_URL}/og/hackathon/radar.png`,
});

export default async function Page() {
  const [trackData, stats] = await Promise.all([
    loadTracks(SLUG),
    loadStats(SLUG),
  ]);
  return (
    <RadarView trackData={trackData ?? undefined} stats={stats ?? undefined} />
  );
}
