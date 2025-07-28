import axios from 'axios';
import dayjs from 'dayjs';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';

import { COINGECKO_API_URL } from '@/features/wallet/constants/coingecko';
const STABLE_COINS = ['USDT', 'USDC', 'USDP', 'sUSD'];

export async function fetchHistoricalTokenUSDValue(token: string, date: Date) {
  try {
    if (STABLE_COINS.includes(token)) {
      return 1;
    }

    const tokenEntry = tokenList.find((t) => t.tokenSymbol === token);
    if (!tokenEntry?.coingeckoSymbol) {
      throw new Error(`No CoinGecko symbol found for token: ${token}`);
    }

    const { coingeckoSymbol } = tokenEntry;

    const formattedDate = dayjs(date).format('DD-MM-YYYY');
    const { data } = await axios.get(
      `${COINGECKO_API_URL}/coins/${coingeckoSymbol}/history`,
      { params: { date: formattedDate } },
    );
    return data.market_data.current_price.usd;
  } catch (error) {
    console.log('Error fetching token value from CoinGecko:', error);
    logger.error('Error fetching token value from CoinGecko:', error);
    return 0;
  }
}
