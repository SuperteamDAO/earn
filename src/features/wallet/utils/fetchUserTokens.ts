import { type Address } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

import { tokenList } from '@/constants/tokenList';

import { type TokenAsset } from '../types/TokenAsset';
import { fetchTokenUSDValue } from './fetchTokenUSDValue';
import { type SolanaRpc } from './getConnection';

export async function fetchUserTokens(
  rpc: SolanaRpc,
  walletAddress: Address,
): Promise<TokenAsset[]> {
  const [solBalanceResponse, tokenAccountsResponse, token2022AccountsResponse] =
    await Promise.all([
      rpc.getBalance(walletAddress).send(),
      rpc
        .getTokenAccountsByOwner(
          walletAddress,
          { programId: TOKEN_PROGRAM_ADDRESS },
          { encoding: 'jsonParsed', commitment: 'confirmed' },
        )
        .send(),
      rpc
        .getTokenAccountsByOwner(
          walletAddress,
          { programId: TOKEN_2022_PROGRAM_ADDRESS },
          { encoding: 'jsonParsed', commitment: 'confirmed' },
        )
        .send(),
    ]);

  const solBalance = solBalanceResponse.value;
  const allTokenAccounts = [
    ...tokenAccountsResponse.value,
    ...token2022AccountsResponse.value,
  ];

  const assets: TokenAsset[] = [];

  if (solBalance > 0n) {
    const solPrice = await fetchTokenUSDValue(
      'So11111111111111111111111111111111111111112',
    );

    const solAmountNumber = Number(solBalance) / 1e9;
    const solAsset: TokenAsset = {
      tokenAddress: 'So11111111111111111111111111111111111111112',
      tokenSymbol: 'SOL',
      tokenImg: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png',
      amount: solAmountNumber,
      usdValue: solAmountNumber * solPrice,
      tokenName: 'Solana',
    };

    assets.push(solAsset);
  }

  const splAssets: TokenAsset[] = await Promise.all(
    allTokenAccounts.map(async (tokenAccount) => {
      const accountData = tokenAccount.account.data.parsed.info;
      const mintAddress = accountData.mint;

      const rawAmount = BigInt(accountData.tokenAmount.amount);
      const decimals = accountData.tokenAmount.decimals;
      const amount = Number(rawAmount) / Math.pow(10, decimals);

      const tokenMetadata = tokenList.find(
        (token) => token.mintAddress === mintAddress,
      );

      if (!tokenMetadata) {
        return {
          tokenAddress: mintAddress,
          tokenSymbol: 'Unknown',
          tokenImg: '',
          amount,
          usdValue: 0,
          tokenName: 'Unknown',
        };
      }
      const usdPrice = await fetchTokenUSDValue(tokenMetadata.mintAddress);

      return {
        tokenAddress: mintAddress,
        tokenSymbol: tokenMetadata.tokenSymbol,
        tokenImg: tokenMetadata.icon,
        amount,
        usdValue: amount * usdPrice,
        tokenName: tokenMetadata.tokenName,
      };
    }),
  );

  const filteredAssets = splAssets.filter((asset) => asset.amount > 0);

  return [...assets, ...filteredAssets];
}
