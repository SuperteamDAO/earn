import { type Connection, type PublicKey } from '@solana/web3.js';

import { fetchTokenMetadata } from './fetchTokenMetadata';

export interface TokenActivity {
  type: 'received' | 'sent';
  amount: number;
  counterpartyAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenImg: string;
  timestamp: number;
}

export async function fetchWalletActivity(
  connection: Connection,
  publicKey: PublicKey,
): Promise<TokenActivity[]> {
  const signatures = await connection.getSignaturesForAddress(publicKey, {
    limit: 50,
  });

  const activities: TokenActivity[] = [];
  const transactions = await Promise.all(
    signatures.map((sig) =>
      connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      }),
    ),
  );

  for (const tx of transactions) {
    if (!tx?.meta) continue;

    const walletIndex = tx.transaction.message.accountKeys.findIndex(
      (acc) => acc.pubkey.toString() === publicKey.toString(),
    );

    if (walletIndex !== -1) {
      const preBalance = tx.meta.preBalances[walletIndex] || 0;
      const postBalance = tx.meta.postBalances[walletIndex] || 0;
      const balanceChange = (postBalance - preBalance) / 1e9;

      if (balanceChange !== 0) {
        activities.push({
          type: balanceChange > 0 ? 'received' : 'sent',
          amount: Math.abs(balanceChange),
          tokenAddress: 'SOL',
          counterpartyAddress: '',
          tokenSymbol: 'SOL',
          tokenImg: '',
          timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
        });
      }
    }

    if (!tx.meta.postTokenBalances || !tx.meta.preTokenBalances) continue;

    const tokenChanges = tx.meta.postTokenBalances
      .map((post) => {
        if (post.owner !== publicKey.toString()) {
          return null;
        }

        const pre = tx.meta?.preTokenBalances?.find(
          (pre) => pre.accountIndex === post.accountIndex,
        );

        const preAmount = pre?.uiTokenAmount.uiAmount || 0;
        const postAmount = post.uiTokenAmount.uiAmount || 0;
        const balanceChange = postAmount - preAmount;

        if (balanceChange === 0) return null;

        return {
          type: balanceChange > 0 ? ('received' as const) : ('sent' as const),
          amount: Math.abs(balanceChange),
          tokenAddress: post.mint,
          counterpartyAddress: '',
          tokenSymbol: '',
          tokenImg: '',
          timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
        };
      })
      .filter(
        (change): change is NonNullable<typeof change> => change !== null,
      );

    for (const change of tokenChanges) {
      const metadata = await fetchTokenMetadata(change.tokenAddress);
      change.tokenSymbol = metadata.symbol;
      change.tokenImg = metadata.image;
      activities.push(change);
    }
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
}
