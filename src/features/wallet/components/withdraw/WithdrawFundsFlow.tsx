import { zodResolver } from '@hookform/resolvers/zod';
import { useSignTransaction } from '@privy-io/react-auth/solana';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { useQueryClient } from '@tanstack/react-query';
import { log } from 'next-axiom';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { tokenList } from '@/constants/tokenList';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { type TokenAsset } from '../../types/TokenAsset';
import { type TxData } from '../../types/TxData';
import { fetchTokenUSDValue } from '../../utils/fetchTokenUSDValue';
import {
  type WithdrawFormData,
  withdrawFormSchema,
} from '../../utils/withdrawFormSchema';
import { type DrawerView } from '../WalletDrawer';
import { ATAConfirmation } from './ATAConfirmation';
import { TransactionDetails } from './TransactionDetails';
import { WithdrawForm } from './WithdrawForm';

interface WithdrawFlowProps {
  tokens: TokenAsset[];
  view: DrawerView;
  setView: (view: DrawerView) => void;
  txData: TxData;
  setTxData: (txData: TxData) => void;
}

export function WithdrawFundsFlow({
  tokens,
  view,
  setView,
  txData,
  setTxData,
}: WithdrawFlowProps) {
  const { user } = useUser();
  const posthog = usePostHog();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [ataCreationCost, setAtaCreationCost] = useState<number>(0);
  const [pendingFormData, setPendingFormData] =
    useState<WithdrawFormData | null>(null);

  const { signTransaction } = useSignTransaction();

  const form = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      tokenAddress: tokens[0]?.tokenAddress ?? '',
      amount: '',
      recipientAddress: '',
    },
  });

  const queryClient = useQueryClient();

  const selectedToken = tokens.find(
    (token) => token.tokenAddress === form.watch('tokenAddress'),
  );

  async function checkATARequirement(
    values: WithdrawFormData,
  ): Promise<string> {
    const connection = new Connection(
      `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
    );

    const recipient = new PublicKey(values.recipientAddress);
    const tokenMint = new PublicKey(values.tokenAddress);

    if (values.tokenAddress === 'So11111111111111111111111111111111111111112') {
      return handleWithdraw(values);
    }

    const receiverATA = await getAssociatedTokenAddressSync(
      tokenMint,
      recipient,
    );

    const receiverATAExists = !!(await connection.getAccountInfo(receiverATA));

    if (!receiverATAExists) {
      const tokenUSDValue = await fetchTokenUSDValue(
        selectedToken?.tokenAddress || '',
      );
      const solUSDValue = await fetchTokenUSDValue(
        'So11111111111111111111111111111111111111112',
      );

      const ataCreationCostInUSD = solUSDValue * 0.0021;
      const tokenAmountToCharge = ataCreationCostInUSD / tokenUSDValue;

      const tokenDetails = tokenList.find(
        (token) => token.tokenSymbol === selectedToken?.tokenSymbol,
      );
      const power = tokenDetails?.decimals as number;
      const cost = Math.ceil(tokenAmountToCharge * 10 ** power);

      setAtaCreationCost(cost);
      setPendingFormData(values);
      setView('ata-confirm');
      return '';
    }

    return handleWithdraw(values);
  }

  async function handleWithdraw(values: WithdrawFormData) {
    setIsProcessing(true);
    setError('');
    try {
      const connection = new Connection(
        `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
      );

      const response = await api.post('/api/wallet/create-signed-transaction', {
        recipientAddress: values.recipientAddress,
        amount: values.amount,
        tokenAddress: values.tokenAddress,
      });

      const transaction = VersionedTransaction.deserialize(
        Buffer.from(response.data.serializedTransaction, 'base64'),
      );

      const userSignedTransaction = await signTransaction({
        transaction,
        connection,
        uiOptions: {
          showWalletUIs: false,
        },
      });
      const signature = await connection.sendRawTransaction(
        userSignedTransaction.serialize(),
      );

      const pollForSignature = async (sig: string) => {
        const MAX_RETRIES = 60;
        let retries = 0;

        while (retries < MAX_RETRIES) {
          const status = await connection.getSignatureStatus(sig, {
            searchTransactionHistory: true,
          });

          if (status?.value?.err) {
            console.log(status.value.err);
            throw new Error(
              `Transaction failed: ${status.value.err.toString()}`,
            );
          }

          if (
            status?.value?.confirmationStatus === 'confirmed' ||
            status.value?.confirmationStatus === 'finalized'
          ) {
            return true;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
          retries++;
        }

        throw new Error('Transaction confirmation timeout');
      };

      try {
        await pollForSignature(signature);
      } catch (e) {
        console.error('Transaction polling failed:', e);
        throw new Error(
          'Transaction might have gone through, check before proceeding',
        );
      }

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
        `Withdrawal failed: ${e}, userId: ${user?.id}, amount: ${values.amount}, destinationAddress: ${values.recipientAddress}, token: ${values.tokenAddress}`,
      );

      let errorMessage =
        e instanceof Error
          ? e.message === 'MFA canceled' || e.message === 'MFA cancelled'
            ? 'Please complete two-factor authentication to withdraw'
            : e.message
          : 'Transaction failed. Please try again.';

      if (e instanceof Error && e.message.includes('insufficient lamports')) {
        errorMessage =
          'Transaction Failed: Sending to this wallet requires you to deposit a small amount of SOL (0.003 SOL) into your Earn wallet. Or, try sending your rewards to an existing wallet which has interacted with stablecoins before.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
      console.log(error);
      setView('withdraw');
      return Promise.reject(new Error('Transaction failed'));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div>
      {view === 'withdraw' && (
        <WithdrawForm
          form={form}
          selectedToken={selectedToken}
          onSubmit={checkATARequirement}
          tokens={tokens}
          isProcessing={isProcessing}
        />
      )}

      {view === 'ata-confirm' && pendingFormData && (
        <ATAConfirmation
          selectedToken={selectedToken}
          formData={pendingFormData}
          onConfirm={() => handleWithdraw(pendingFormData)}
          onCancel={() => {
            setPendingFormData(null);
            setView('withdraw');
          }}
          ataCreationCost={ataCreationCost}
          isProcessing={isProcessing}
        />
      )}

      {view === 'success' && <TransactionDetails txData={txData} />}
      {view === 'history' && <TransactionDetails txData={txData} />}
    </div>
  );
}
