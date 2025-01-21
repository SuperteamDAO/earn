import { COINGECKO_API_URL } from '../constants/coingecko';

const tokenCache = new Map<string, { metadata: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

export async function fetchTokenMetadata(mintAddress: string) {
  const cached = tokenCache.get(mintAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.metadata;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/solana/contract/${mintAddress}`,
    );

    if (!response.ok) {
      return {
        symbol: 'UNKNOWN',
        image: '',
      };
    }

    const data = await response.json();
    const metadata = {
      symbol: data.symbol.toUpperCase(),
      image: data.image?.small || '',
    };

    tokenCache.set(mintAddress, {
      metadata,
      timestamp: Date.now(),
    });

    return metadata;
  } catch (error) {
    console.error(`Error fetching metadata for ${mintAddress}:`, error);
    return {
      symbol: 'UNKNOWN',
      image: '',
    };
  }
}
