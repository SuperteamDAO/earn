import axios from 'axios';

import { getURL } from '@/utils/validUrl';

export async function fetchTokenUSDValue(mintAddress: string): Promise<number> {
  try {
    if (!mintAddress) {
      throw new Error('Mint address is required');
    }

    const priceUrl = new URL('/api/wallet/price', getURL());
    priceUrl.searchParams.set('mintAddress', mintAddress);

    const { data } = await axios.get(priceUrl.toString());

    return data.price;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}
