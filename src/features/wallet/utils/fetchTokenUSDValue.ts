import { api } from '@/lib/api';

export async function fetchTokenUSDValue(mintAddress: string): Promise<number> {
  try {
    if (!mintAddress) {
      throw new Error('Mint address is required');
    }

    const { data } = await api.get(
      `https://earn.superteam.fun/api/wallet/price?mintAddress=${mintAddress}`,
    );

    return data.price;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}
