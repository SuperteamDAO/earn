import * as Effect from 'effect/Effect';
import { redirect } from 'next/navigation';

import { Default } from '@/layouts/Default';
import { pageMetadata } from '@/lib/metadata';
import { signInHref } from '@/lib/safe-next';
import { getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as Wallet from '@/server/wallet';

import { privyProps } from '../../privy-props';
import { EmbedSignIn } from './embed-sign-in';
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

// Earn's wallet drawer's content: Privy's SDK (for signing withdrawals)
// loads only here. The drawer frames it (`?embed=1`,
// src/features/wallet/components/WalletDrawer.tsx); on its own it's a page.
// Balances render on the server; activity, slower to read, streams in.
export default async function WalletPage({
  searchParams,
}: PageProps<'/earn/wallet'>) {
  const embed = (await searchParams).embed === '1';
  const viewer = await getViewer();
  if (!viewer) {
    // Framed, the drawer signs them in; on its own, sign-in (which renews a
    // lapsed session too) sends them back.
    if (embed) return <EmbedSignIn />;
    redirect(signInHref(HERE));
  }

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

  const view = (
    <WalletView
      privy={privy}
      assets={assets}
      activity={activity}
      embed={embed}
    />
  );
  return embed ? view : <Default>{view}</Default>;
}
