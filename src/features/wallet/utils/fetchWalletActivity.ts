import { type Connection, type PublicKey } from '@solana/web3.js';

import { tokenList } from '@/constants/tokenList';

import { type TokenActivity } from '../types/TokenActivity';
import { fetchTokenUSDValue } from './fetchTokenUSDValue';

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

  let solPrice = 0;
  try {
    solPrice = await fetchTokenUSDValue(
      'So11111111111111111111111111111111111111112',
    );
  } catch (error) {
    console.error('Error fetching SOL price:', error);
  }

  const tokenPriceCache: Record<string, number> = {};

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
        const amount = Math.abs(balanceChange);
        activities.push({
          type: balanceChange > 0 ? 'Credited' : 'Withdrawn',
          amount,
          usdValue: amount * solPrice,
          tokenAddress: 'So11111111111111111111111111111111111111112',
          counterpartyAddress: '',
          tokenSymbol: 'SOL',
          tokenImg:
            'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png',
          timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
        });
      }
    }

    if (!tx.meta.postTokenBalances || !tx.meta.preTokenBalances) continue;

    const tokenPromises = tx.meta.postTokenBalances
      .map(async (post) => {
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

        const amount = Math.abs(balanceChange);
        let tokenPrice = 0;

        if (!tokenPriceCache[post.mint]) {
          try {
            tokenPriceCache[post.mint] = await fetchTokenUSDValue(post.mint);
          } catch (error) {
            console.error(
              `Error fetching price for token ${post.mint}:`,
              error,
            );
          }
        }
        tokenPrice = tokenPriceCache[post.mint] || 0;

        const metadata = tokenList.find(
          (token) => token.mintAddress === post.mint,
        );
        if (!metadata) return null;

        return {
          type: balanceChange > 0 ? 'Credited' : 'Withdrawn',
          amount,
          usdValue: amount * tokenPrice,
          tokenAddress: post.mint,
          counterpartyAddress: '',
          tokenSymbol: metadata.tokenSymbol,
          tokenImg: metadata.icon,
          timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
        } as TokenActivity;
      })
      .filter(
        (promise): promise is Promise<TokenActivity | null> => promise !== null,
      );

    const tokenChanges = await Promise.all(tokenPromises);
    activities.push(
      ...tokenChanges.filter(
        (change): change is TokenActivity => change !== null,
      ),
    );
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
}
