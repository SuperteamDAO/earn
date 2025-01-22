import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { type Connection, type PublicKey } from '@solana/web3.js';

import { tokenList } from '@/constants/tokenList';

import { fetchTokenUSDValue } from './fetchTokenUSDValue';

export interface TokenAsset {
  tokenAddress: string;
  tokenSymbol: string;
  tokenImg: string;
  amount: number;
  usdValue: number;
  tokenName: string;
}

export async function fetchUserTokens(
  connection: Connection,
  publicKey: PublicKey,
): Promise<TokenAsset[]> {
  const solBalance = await connection.getBalance(publicKey);
  const solAsset: TokenAsset = {
    tokenAddress: 'SOL',
    tokenSymbol: 'SOL',
    tokenImg: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png',
    amount: solBalance / 1e9,
    usdValue: 0,
    tokenName: 'Solana',
  };

  const solPrice = await fetchTokenUSDValue(
    'So11111111111111111111111111111111111111112',
  );
  solAsset.usdValue = solAsset.amount * solPrice;

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    publicKey,
    {
      programId: TOKEN_PROGRAM_ID,
    },
  );

  const splAssets: TokenAsset[] = await Promise.all(
    tokenAccounts.value.map(async (tokenAccount) => {
      const accountData = tokenAccount.account.data.parsed.info;
      const mintAddress = accountData.mint;
      const amount = Number(accountData.tokenAmount.uiAmount);

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

  return [solAsset, ...splAssets.filter((asset) => asset.amount > 0)];
}
