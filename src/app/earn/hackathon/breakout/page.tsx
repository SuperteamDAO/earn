import 'server-only';

import { pageMetadata } from '@/lib/metadata';

import { loadHackathon, loadStats, loadTracks } from '../hackathon-data';
import { BreakoutView } from './breakout-view';

const SLUG = 'breakout';

export const metadata = pageMetadata({
  title: 'Breakout | Superteam Earn',
  description: 'Solana Breakout Online Hackathon',
  canonical: 'https://superteam.fun/earn/hackathon/breakout/',
  og: 'https://res.cloudinary.com/dgvnuwspr/image/upload/assets/hackathon/breakout/og-image.png',
});

export default async function Page() {
  const [hackathon, trackData, stats] = await Promise.all([
    loadHackathon(SLUG),
    loadTracks(SLUG),
    loadStats(SLUG),
  ]);
  return (
    <BreakoutView
      hackathon={hackathon}
      trackData={trackData ?? undefined}
      stats={stats ?? undefined}
    />
  );
}
