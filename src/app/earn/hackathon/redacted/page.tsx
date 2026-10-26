import 'server-only';

import { pageMetadata } from '@/lib/metadata';

import { loadHackathon, loadStats, loadTracks } from '../hackathon-data';
import { RedactedView } from './redacted-view';

const SLUG = 'redacted';

export const metadata = pageMetadata({
  title: 'Helius [REDACTED] Hackathon | Superteam Earn',
  description:
    'Join the Helius Hackathon—a data-driven challenge empowering analysts, data scientists, and on-chain sleuths to expose fraud, build insightful dashboards, and advance Solana’s social layer.',
  canonical: 'https://superteam.fun/earn/hackathon/redacted/',
  og: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1741616337/assets/hackathon/redacted/redacted-og',
});

export default async function Page() {
  const [hackathon, trackData, stats] = await Promise.all([
    loadHackathon(SLUG),
    loadTracks(SLUG),
    loadStats(SLUG),
  ]);
  return (
    <RedactedView
      hackathon={hackathon}
      trackData={trackData ?? undefined}
      stats={stats ?? undefined}
    />
  );
}
