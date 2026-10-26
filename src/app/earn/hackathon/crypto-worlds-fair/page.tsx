import 'server-only';

import { pageMetadata } from '@/lib/metadata';

import { loadHackathon, loadStats, loadTracks } from '../hackathon-data';
import { CryptoWorldsFairView } from './crypto-worlds-fair-view';

const SLUG = 'crypto-worlds-fair';
const OG_IMAGE =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1788934366/assets/hackathon/crypto-world-fair/og.png';

export async function generateMetadata() {
  const hackathon = await loadHackathon(SLUG);
  return pageMetadata({
    title: "Crypto World's Fair | Superteam Earn",
    description: hackathon.description,
    canonical: 'https://superteam.fun/earn/hackathon/crypto-worlds-fair/',
    og: OG_IMAGE,
  });
}

export default async function Page() {
  const [hackathon, trackData, stats] = await Promise.all([
    loadHackathon(SLUG),
    loadTracks(SLUG),
    loadStats(SLUG),
  ]);
  return (
    <CryptoWorldsFairView
      hackathon={hackathon}
      trackData={trackData}
      stats={stats ?? undefined}
    />
  );
}
