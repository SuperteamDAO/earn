import 'server-only';

import { pageMetadata } from '@/lib/metadata';

import {
  loadHackathon,
  loadStats,
  loadTracks,
} from '../hackathon/hackathon-data';
import { NextStopBreakpointView } from './next-stop-breakpoint-view';

const SLUG = 'next-stop-breakpoint';

export const metadata = pageMetadata({
  title: 'Next Stop Breakpoint | Superteam Earn',
  description: 'Submit to bounties for a chance to win Breakpoint tickets.',
  canonical: 'https://superteam.fun/earn/next-stop-breakpoint/',
  og: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1790232920/assets/hackathon/next-stop-breakpoint/og.png',
});

export default async function Page() {
  const [hackathon, stats, tracks] = await Promise.all([
    loadHackathon(SLUG),
    loadStats(SLUG),
    loadTracks(SLUG),
  ]);
  if (!hackathon.startDate || !hackathon.deadline) {
    throw new Error(
      'Next Stop Breakpoint hackathon not found or dates are missing',
    );
  }
  return (
    <NextStopBreakpointView
      startDate={hackathon.startDate.toISOString()}
      closeDate={hackathon.deadline.toISOString()}
      stats={stats}
      tracks={tracks}
    />
  );
}
