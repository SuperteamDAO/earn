import 'server-only';

import { pageMetadata } from '@/lib/metadata';

import { loadHackathon, loadStats, loadTracks } from '../hackathon-data';
import { CypherpunkView } from './cypherpunk-view';

const SLUG = 'cypherpunk';

export const metadata = pageMetadata({
  title: 'Cypherpunk | Superteam Earn',
  description: 'Solana Cypherpunk Online Hackathon',
  canonical: 'https://superteam.fun/earn/hackathon/cypherpunk/',
  og: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1760541751/assets/hackathon/cypherpunk/og-image.png',
});

export default async function Page() {
  const [hackathon, trackData, stats] = await Promise.all([
    loadHackathon(SLUG),
    loadTracks(SLUG),
    loadStats(SLUG),
  ]);
  return (
    <CypherpunkView
      hackathon={hackathon}
      trackData={trackData ?? undefined}
      stats={stats ?? undefined}
    />
  );
}
