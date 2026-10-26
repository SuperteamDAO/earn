import * as Effect from 'effect/Effect';
import { redirect } from 'next/navigation';

import { Default } from '@/layouts/Default';
import { pageMetadata } from '@/lib/metadata';
import { signInHref } from '@/lib/safe-next';
import { getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as Wallet from '@/server/wallet';

import { privyProps } from '../../privy-props';
import { WalletView } from './wallet-view';

export const metadata = pageMetadata({
  title: 'Wallet | Superteam Earn',
  description: 'Your Superteam Earn wallet.',
  noIndex: true,
});

const HERE = '/earn/wallet/';

// What failed reads as `null`: the list shows its error.
const read = <A, E>(effect: Effect.Effect<A, E, Wallet.Wallet>) =>
  runtime.runPromise(
    effect.pipe(
      Effect.map((value): A | null => value),
      Effect.orElseSucceed(() => null),
    ),
  );

// Earn's wallet drawer, as its own page: Privy's SDK (for signing
// withdrawals) loads only here. Balances render on the server; activity,
// slower to read, streams in.
export default async function WalletPage() {
  const viewer = await getViewer();
  // This page's CSP has no room for the hidden renewal frame, so sign-in
  // renews a lapsed session and sends them back.
  if (!viewer) redirect(signInHref(HERE));

  const activity = read(
    Wallet.Wallet.use((wallet) => wallet.activity(viewer.id)).pipe(
      Effect.map((list) => [...list]),
    ),
  );
  const [assets, privy] = await Promise.all([
    read(
      Wallet.Wallet.use((wallet) => wallet.assets(viewer.id)).pipe(
        Effect.map((list) => [...list]),
      ),
    ),
    privyProps(),
  ]);

  return (
    <Default>
      <WalletView privy={privy} assets={assets} activity={activity} />
    </Default>
  );
}
