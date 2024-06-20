import axios from 'axios';
import dayjs from 'dayjs';

import { tokenList } from '@/constants';

export async function fetchTokenUSDValue(token: string, date: Date) {
  try {
    if (token === 'USDT' || token === 'USDC') {
      return 1;
    }

    const tokenEntry = tokenList.find((t) => t.tokenSymbol === token);
    const coingeckoSymbol = tokenEntry?.coingeckoSymbol as string;

    const formattedDate = dayjs(date).format('DD-MM-YYYY');

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coingeckoSymbol}/history`,
      {
        params: {
          date: formattedDate,
        },
      },
    );

    return response.data.market_data.current_price.usd;
  } catch (error) {
    console.error('Error fetching token value from CoinGecko:', error);
    return 1;
  }
}
