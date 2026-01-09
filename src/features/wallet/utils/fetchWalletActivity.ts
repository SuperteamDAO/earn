import { type Address } from '@solana/kit';

import { tokenList } from '@/constants/tokenList';

import { type TokenActivity } from '../types/TokenActivity';
import { fetchTokenUSDValue } from './fetchTokenUSDValue';
import { type SolanaRpc } from './getConnection';

export async function fetchWalletActivity(
  rpc: SolanaRpc,
  walletAddress: Address,
): Promise<TokenActivity[]> {
  const signaturesResponse = await rpc
    .getSignaturesForAddress(walletAddress, { limit: 50 })
    .send();
  const signatures = signaturesResponse;

  const activities: TokenActivity[] = [];
  const batchSize = 5;

  for (let i = 0; i < signatures.length; i += batchSize) {
    const batchSignatures = signatures.slice(i, i + batchSize);
    const transactionBatch = await Promise.all(
      batchSignatures.map((sig) =>
        rpc
          .getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed',
            encoding: 'jsonParsed',
          })
          .send(),
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

    for (let j = 0; j < transactionBatch.length; j++) {
      const tx = transactionBatch[j];
      const signature = batchSignatures[j]?.signature;

      if (!tx?.meta) continue;

      const walletIndex = tx.transaction.message.accountKeys.findIndex(
        (acc: any) => acc.pubkey === walletAddress || acc === walletAddress,
      );

      if (walletIndex !== -1) {
        const preBalance = BigInt(tx.meta.preBalances[walletIndex] || 0);
        const postBalance = BigInt(tx.meta.postBalances[walletIndex] || 0);
        const balanceChange = Number(postBalance - preBalance) / 1e9;

        if (balanceChange !== 0) {
          const amount = Math.abs(balanceChange);
          if (amount === 1e-7) continue;
          let counterpartyAddress = '';
          if (tx.transaction.message.instructions) {
            const transferInstruction =
              tx.transaction.message.instructions.find((instruction) => {
                if (!('parsed' in instruction)) return false;
                const parsed = instruction.parsed as {
                  type?: string;
                  info?: { source?: string; destination?: string };
                };
                return (
                  parsed.type === 'transfer' &&
                  parsed.info &&
                  (parsed.info.source === walletAddress ||
                    parsed.info.destination === walletAddress)
                );
              });

            if (transferInstruction && 'parsed' in transferInstruction) {
              const parsed = transferInstruction.parsed as {
                info?: { source?: string; destination?: string };
              };
              const info = parsed.info;
              if (info?.source && info?.destination) {
                counterpartyAddress =
                  info.source === walletAddress
                    ? info.destination
                    : info.source;
              }
            }
          }

          activities.push({
            type: balanceChange > 0 ? 'Credited' : 'Withdrawn',
            amount,
            usdValue: amount * solPrice,
            tokenAddress: 'So11111111111111111111111111111111111111112',
            counterpartyAddress,
            tokenSymbol: 'SOL',
            tokenImg:
              'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png',
            timestamp: tx.blockTime ? Number(tx.blockTime) * 1000 : Date.now(),
            signature: signature ?? '',
          });
        }
      }

      if (!tx.meta.postTokenBalances || !tx.meta.preTokenBalances) continue;

      const tokenPromises = tx.meta.postTokenBalances
        .map(async (post) => {
          if (post.owner !== walletAddress) {
            return null;
          }

          const pre = tx.meta?.preTokenBalances?.find(
            (pre) => pre.accountIndex === post.accountIndex,
          );

          const preAmount = parseFloat(
            pre?.uiTokenAmount?.uiAmountString ?? '0',
          );
          const postAmount = parseFloat(
            post.uiTokenAmount?.uiAmountString ?? '0',
          );
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

          let counterpartyAddress = '';
          if (tx.transaction.message.instructions) {
            const transferInstruction =
              tx.transaction.message.instructions.find((instruction) => {
                if (!('parsed' in instruction)) return false;
                const parsed = instruction.parsed as { type?: string };
                return (
                  (parsed.type === 'transfer' ||
                    parsed.type === 'transferChecked') &&
                  (instruction as any).program === 'spl-token'
                );
              });

            if (transferInstruction && 'parsed' in transferInstruction) {
              const parsed = transferInstruction.parsed as {
                info?: {
                  source?: string;
                  destination?: string;
                  authority?: string;
                };
              };

              const info = parsed.info;
              if (info?.source && info?.destination) {
                counterpartyAddress =
                  balanceChange > 0 ? info.source : info.destination;
              }
            }
          }

          return {
            type: balanceChange > 0 ? 'Credited' : 'Withdrawn',
            amount,
            usdValue: amount * tokenPrice,
            tokenAddress: post.mint,
            counterpartyAddress,
            tokenSymbol: metadata.tokenSymbol,
            tokenImg: metadata.icon,
            timestamp: tx.blockTime ? Number(tx.blockTime) * 1000 : Date.now(),
            signature,
          } as TokenActivity;
        })
        .filter(
          (promise): promise is Promise<TokenActivity | null> =>
            promise !== null,
        );

      const tokenChanges = await Promise.all(tokenPromises);
      activities.push(
        ...tokenChanges.filter(
          (change): change is TokenActivity => change !== null,
        ),
      );
    }

    if (i + batchSize < signatures.length) {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Increased delay to avoid rate limiting
    }
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
}
