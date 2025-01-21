import dayjs from 'dayjs';

import { tokenList } from '@/constants/tokenList';
import { api } from '@/lib/api';
import logger from '@/lib/logger';

import { COINGECKO_API_URL } from '@/features/wallet/constants/coingecko';
const STABLE_COINS = ['USDT', 'USDC', 'USDP'];

async function getHistoricalPrice(coingeckoSymbol: string, date: Date) {
  const formattedDate = dayjs(date).format('DD-MM-YYYY');
  const { data } = await api.get(
    `${COINGECKO_API_URL}/coins/${coingeckoSymbol}/history`,
    { params: { date: formattedDate } },
  );
  return data.market_data.current_price.usd;
}

async function getCurrentPrice(coingeckoSymbol: string) {
  const { data } = await api.get(`${COINGECKO_API_URL}/simple/price`, {
    params: { ids: coingeckoSymbol, vs_currencies: 'USD' },
  });
  return data[coingeckoSymbol].usd;
}

export async function fetchTokenUSDValue(token: string, date?: Date) {
  try {
    if (STABLE_COINS.includes(token)) {
      return 1;
    }

    const tokenEntry = tokenList.find((t) => t.tokenSymbol === token);
    if (!tokenEntry?.coingeckoSymbol) {
      throw new Error(`No CoinGecko symbol found for token: ${token}`);
    }

    const { coingeckoSymbol } = tokenEntry;
    return date
      ? await getHistoricalPrice(coingeckoSymbol, date)
      : await getCurrentPrice(coingeckoSymbol);
  } catch (error) {
    logger.error('Error fetching token value from CoinGecko:', error);
    return 0;
  }
}
