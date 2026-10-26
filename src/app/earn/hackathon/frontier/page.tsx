import 'server-only';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { pageMetadata } from '@/lib/metadata';

import { loadHackathon, loadStats, loadTracks } from '../hackathon-data';
import { FrontierView } from './frontier-view';

const SLUG = 'frontier';

export const metadata = pageMetadata({
  title: 'Frontier | Superteam Earn',
  description: 'Solana Frontier Online Hackathon',
  canonical: 'https://superteam.fun/earn/hackathon/frontier/',
  og: `${ASSET_URL}/hackathon/frontier/og.webp`,
});

export default async function Page() {
  const [hackathon, trackData, stats] = await Promise.all([
    loadHackathon(SLUG),
    loadTracks(SLUG),
    loadStats(SLUG),
  ]);
  return (
    <FrontierView
      hackathon={hackathon}
      trackData={trackData ?? undefined}
      stats={stats ?? undefined}
    />
  );
}
