import * as Layer from 'effect/Layer';

import * as CreditHistory from '@/server/credit-history';
import * as SpamDisputes from '@/server/spam-disputes';
import * as Wallet from '@/server/wallet';
import * as WalletPrices from '@/server/wallet-prices';
import * as WalletRpc from '@/server/wallet-rpc';

// The wallet area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(
  Wallet.layer,
  CreditHistory.layer,
  SpamDisputes.layer,
).pipe(Layer.provideMerge(Layer.mergeAll(WalletRpc.layer, WalletPrices.layer)));
