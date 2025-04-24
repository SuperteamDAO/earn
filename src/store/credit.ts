import { useQuery } from '@tanstack/react-query';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

import { api } from '@/lib/api';
import { dayjs } from '@/utils/dayjs';

import { useUser } from './user';

export const creditBalanceAtom = atom<number | null>(null);

const lastRefreshTimestampAtom = atom<string | null>(null);

interface CreditBalanceResponse {
  balance: number;
}

export const useCreditBalance = () => {
  const [creditBalance, setCreditBalance] = useAtom(creditBalanceAtom);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useAtom(
    lastRefreshTimestampAtom,
  );
  const { user } = useUser();
  const userId = user?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['creditBalance', userId],
    queryFn: async () => {
      const response = await api.get<CreditBalanceResponse>(
        '/api/user/credit/balance',
      );
      return response.data.balance;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data !== undefined) {
      setCreditBalance(data);
      setLastRefreshTimestamp(new Date().toISOString());
    }
  }, [data, setCreditBalance, setLastRefreshTimestamp]);

  useEffect(() => {
    if (!lastRefreshTimestamp || !userId) return;

    const lastRefresh = dayjs(lastRefreshTimestamp);
    const now = dayjs();

    if (lastRefresh.month() !== now.month()) {
      refetch();
    }
  }, [lastRefreshTimestamp, refetch, userId]);

  return {
    creditBalance: creditBalance ?? 0,
    isLoading,
  };
};
