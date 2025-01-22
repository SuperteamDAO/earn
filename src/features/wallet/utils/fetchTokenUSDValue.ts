interface PriceResponse {
  data: {
    [key: string]: {
      id: string;
      type: string;
      price: string;
    };
  };
  timeTaken: number;
}

export async function fetchTokenUSDValue(mintAddress: string): Promise<number> {
  try {
    if (!mintAddress) {
      throw new Error('Mint address is required');
    }

    const baseUrl = 'https://api.jup.ag/price/v2';
    const response = await fetch(`${baseUrl}?ids=${mintAddress}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as PriceResponse;

    if (!data.data || !data.data[mintAddress]) {
      throw new Error(`No price data found for token: ${mintAddress}`);
    }

    const price = parseFloat(data.data[mintAddress].price);

    return price;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}
