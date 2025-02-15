import { zodResolver } from '@hookform/resolvers/zod';
import { useSignTransaction } from '@privy-io/react-auth/solana';
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { useQueryClient } from '@tanstack/react-query';
import { log } from 'next-axiom';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { type TokenAsset } from '../../types/TokenAsset';
import { type TxData } from '../../types/TxData';
import { createTransferInstructions } from '../../utils/createTransferInstructions';
import {
  type WithdrawFormData,
  withdrawFormSchema,
} from '../../utils/withdrawFormSchema';
import { type DrawerView } from '../WalletDrawer';
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

  const { signTransaction } = useSignTransaction();

  const form = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      tokenAddress: tokens[0]?.tokenAddress ?? '',
      amount: '',
      address: '',
    },
  });

  const queryClient = useQueryClient();

  const selectedToken = tokens.find(
    (token) => token.tokenAddress === form.watch('tokenAddress'),
  );

  async function handleWithdraw(values: WithdrawFormData) {
    setIsProcessing(true);
    setError('');
    try {
      const connection = new Connection(
        `https://${process.env.NEXT_PUBLIC_RPC_URL}`,
      );

      let blockhash;
      try {
        const response = await connection.getLatestBlockhash('finalized');
        blockhash = response.blockhash;
      } catch (e) {
        throw new Error('RPC Timed out');
      }

      const instructions = await createTransferInstructions(
        connection,
        values,
        user?.walletAddress as string,
        selectedToken,
      );

      const message = new TransactionMessage({
        payerKey: new PublicKey(process.env.NEXT_PUBLIC_FEEPAYER as string),
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);

      const userSignedTransaction = await signTransaction({
        transaction,
        connection,
        uiOptions: {
          buttonText: 'Confirm',
          description: 'Note that this is an irreversible action',
          successHeader: 'We are processing your withdrawal..',
          successDescription: 'You can close this window now',
          transactionInfo: {
            title: 'Confirm Withdrawal',
            action: '',
          },
          showWalletUIs: false,
        },
      });

      const serializedTransaction = Buffer.from(
        userSignedTransaction.serialize(),
      ).toString('base64');

      const response = await api.post('/api/wallet/sign-transaction', {
        serializedTransaction,
      });

      const signedTransaction = VersionedTransaction.deserialize(
        Buffer.from(response.data.serializedTransaction, 'base64'),
      );

      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
      );

      const confirmation = await connection.confirmTransaction(
        signature,
        'confirmed',
      );

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

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
      log.error(`Withdrawal failed: ${e}`);

      const errorMessage =
        e instanceof Error
          ? e.message
          : 'Transaction failed. Please try again.';
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
          onSubmit={handleWithdraw}
          tokens={tokens}
          isProcessing={isProcessing}
        />
      )}

      {view === 'success' && <TransactionDetails txData={txData} />}
      {view === 'history' && <TransactionDetails txData={txData} />}
    </div>
  );
}
