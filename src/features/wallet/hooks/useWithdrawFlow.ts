import { zodResolver } from '@hookform/resolvers/zod';
import {
  useSendTransaction,
  useSignTransaction,
} from '@privy-io/react-auth/solana';
import { useQueryClient } from '@tanstack/react-query';
import { log } from 'next-axiom';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useUser } from '@/store/user';

import { type DrawerView } from '../components/WalletDrawer';
import {
  handleWithdrawError,
  processWithdrawTransaction,
} from '../services/withdrawTransactionService';
import { type TokenAsset } from '../types/TokenAsset';
import { type TxData } from '../types/TxData';
import {
  type WithdrawFormData,
  withdrawFormSchema,
} from '../utils/withdrawFormSchema';

interface UseWithdrawFlowParams {
  tokens: TokenAsset[];
  setView: (view: DrawerView) => void;
  setTxData: (txData: TxData) => void;
}

export function useWithdrawFlow({
  tokens,
  setView,
  setTxData,
}: UseWithdrawFlowParams) {
  const { user } = useUser();
  const posthog = usePostHog();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const queryClient = useQueryClient();

  const { signTransaction } = useSignTransaction();
  const { sendTransaction } = useSendTransaction();

  const form = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      tokenAddress: tokens[0]?.tokenAddress ?? '',
      amount: '',
      address: '',
    },
  });

  const selectedToken = tokens.find(
    (token) => token.tokenAddress === form.watch('tokenAddress'),
  );

  async function handleWithdraw(values: WithdrawFormData) {
    setIsProcessing(true);
    setError('');

    try {
      const { signature } = await processWithdrawTransaction({
        values,
        userWalletAddress: user?.walletAddress as string,
        selectedToken,
        signTransaction,
        sendTransaction,
      });

      setTxData({
        signature,
        ...values,
        timestamp: Date.now(),
        type: 'Withdrawn',
      });

      await queryClient.invalidateQueries({
        queryKey: ['wallet', 'assets'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['wallet', 'activity'],
      });

      posthog.capture('withdraw_complete');
      setView('success');

      return signature;
    } catch (e) {
      posthog.capture('withdraw_failed');
      console.error('Withdrawal failed:', e);
      log.error(
        `Withdrawal failed: ${e}, userId: ${user?.id}, amount: ${values.amount}, destinationAddress: ${values.address}, token: ${values.tokenAddress}`,
      );

      const errorMessage = handleWithdrawError(e);
      setError(errorMessage);
      toast.error(errorMessage);
      setView('withdraw');

      return Promise.reject(new Error('Transaction failed'));
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    form,
    selectedToken,
    isProcessing,
    error,
    handleWithdraw,
  };
}
