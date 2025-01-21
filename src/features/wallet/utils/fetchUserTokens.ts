import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { type Connection, type PublicKey } from '@solana/web3.js';

import { fetchTokenMetadata } from './fetchTokenMetadata';
import { fetchTokenUSDValue } from './fetchTokenUSDValue';

export interface TokenAsset {
  tokenAddress: string;
  tokenSymbol: string;
  tokenImg: string;
  amount: number;
  usdValue: number;
}

export async function fetchUserTokens(
  connection: Connection,
  publicKey: PublicKey,
): Promise<TokenAsset[]> {
  const solBalance = await connection.getBalance(publicKey);
  const solAsset: TokenAsset = {
    tokenAddress: 'SOL',
    tokenSymbol: 'SOL',
    tokenImg: '',
    amount: solBalance / 1e9,
    usdValue: 0,
  };

  const solPrice = await fetchTokenUSDValue('SOL');
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

      const tokenMetadata = await fetchTokenMetadata(mintAddress);
      const usdPrice = await fetchTokenUSDValue(tokenMetadata.symbol);

      return {
        tokenAddress: mintAddress,
        tokenSymbol: tokenMetadata.symbol,
        tokenImg: tokenMetadata.image,
        amount,
        usdValue: amount * usdPrice,
      };
    }),
  );

  return [solAsset, ...splAssets.filter((asset) => asset.amount > 0)];
}
