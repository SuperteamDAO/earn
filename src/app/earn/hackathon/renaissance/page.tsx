import 'server-only';

import { pageMetadata } from '@/lib/metadata';

import { loadStats, loadTracks } from '../hackathon-data';
import { RenaissanceView } from './renaissance-view';

const SLUG = 'renaissance';

export const metadata = pageMetadata({
  title: 'Renaissance | Superteam Earn',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  canonical: 'https://superteam.fun/earn/hackathon/renaissance/',
});

export default async function Page() {
  const [trackData, stats] = await Promise.all([
    loadTracks(SLUG),
    loadStats(SLUG),
  ]);
  return (
    <RenaissanceView
      trackData={trackData ?? undefined}
      stats={stats ?? undefined}
    />
  );
}
