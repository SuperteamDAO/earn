import 'server-only';

import { pageMetadata } from '@/lib/metadata';

import { loadStats, loadTracks } from '../hackathon-data';
import { ScribesView } from './scribes-view';

const SLUG = 'scribes';

export const metadata = pageMetadata({
  title: 'Solana Scribes | Superteam Earn',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  canonical: 'https://superteam.fun/earn/hackathon/scribes/',
});

export default async function Page() {
  const [trackData, stats] = await Promise.all([
    loadTracks(SLUG),
    loadStats(SLUG),
  ]);
  return (
    <ScribesView
      trackData={trackData ?? undefined}
      stats={stats ?? undefined}
    />
  );
}
