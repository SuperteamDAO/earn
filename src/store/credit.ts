import { useQuery } from '@tanstack/react-query';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

import { api } from '@/lib/api';
import { dayjs } from '@/utils/dayjs';

import { useUser } from './user';

const creditBalanceAtom = atom<number | null>(null);

interface CreditBalanceResponse {
  balance: number;
}

export const useCreditBalance = () => {
  const [creditBalance, setCreditBalance] = useAtom(creditBalanceAtom);
  const { user } = useUser();
  const userId = user?.id;
  // Credits reset monthly, so a new month gets its own cache entry and refetches.
  const month = dayjs().format('YYYY-MM');

  const { data, isLoading } = useQuery({
    queryKey: ['creditBalance', userId, month],
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
    }
  }, [data, setCreditBalance]);

  return {
    creditBalance: creditBalance ?? 0,
    isLoading,
  };
};
