import 'server-only';

import { pageMetadata } from '@/lib/metadata';

import { loadHackathon } from '../hackathon-data';
import { MobiusView } from './mobius-view';

const SLUG = 'mobius';

export const metadata = pageMetadata({
  title: 'Sonic Mobius | Superteam Earn',
  description:
    'Join the first-ever SVM hackathon on Solana – Sonic Mobius Hackathon – with a $1,000,000 prize pool! Build, launch on Sonic SVM Mainnet, and onboard the next billion users.',
  canonical: 'https://superteam.fun/earn/hackathon/mobius/',
  og: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1740832046/assets/hackathon/mobius/sonic-mobius-og.png',
});

export default async function Page() {
  return <MobiusView hackathon={await loadHackathon(SLUG)} />;
}
