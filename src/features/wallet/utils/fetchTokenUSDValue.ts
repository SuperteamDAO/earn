import { api } from '@/lib/api';

export async function fetchTokenUSDValue(mintAddress: string): Promise<number> {
  try {
    if (!mintAddress) {
      throw new Error('Mint address is required');
    }

    const { data } = await api.get(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/wallet/price?mintAddress=${mintAddress}`,
    );

    return data.price;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}
