import axios from 'axios';

export async function fetchTokenUSDValue(symbol: string) {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: symbol,
          vs_currencies: 'USD',
        },
      },
    );
    return response.data[symbol].usd;
  } catch (error) {
    console.error('Error fetching token value from CoinGecko:', error);
    return 0;
  }
}
