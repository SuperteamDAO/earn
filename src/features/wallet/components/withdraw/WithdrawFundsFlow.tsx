import { zodResolver } from '@hookform/resolvers/zod';
import {
  useSignAndSendTransaction,
  useWallets,
} from '@privy-io/react-auth/solana';
import { address, type Signature } from '@solana/kit';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import bs58 from 'bs58';
import { log } from 'next-axiom';
import posthog from 'posthog-js';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { tokenList } from '@/constants/tokenList';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { classifySolanaError } from '@/utils/solanaTransactionHelpers';

import { type TokenAsset } from '../../types/TokenAsset';
import { type TxData } from '../../types/TxData';
import { type DrawerView } from '../../types/WalletTypes';
import { fetchTokenUSDValue } from '../../utils/fetchTokenUSDValue';
import { getRpc } from '../../utils/getConnection';
import {
  type WithdrawFormData,
  type WithdrawFormInput,
  withdrawFormSchema,
} from '../../utils/withdrawFormSchema';
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [ataCreationCost, setAtaCreationCost] = useState<number>(0);
  const [pendingFormData, setPendingFormData] =
    useState<WithdrawFormData | null>(null);

  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const form = useForm<WithdrawFormInput, unknown, WithdrawFormData>({
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

  const detectTokenProgram = async (mintAddress: string) => {
    if (mintAddress === 'So11111111111111111111111111111111111111112') {
      return TOKEN_PROGRAM_ADDRESS;
    }
    const rpc = getRpc();
    try {
      const mintInfo = await rpc
        .getAccountInfo(address(mintAddress), { encoding: 'base64' })
        .send();
      if (mintInfo.value?.owner === TOKEN_2022_PROGRAM_ADDRESS) {
        return TOKEN_2022_PROGRAM_ADDRESS;
      }
      return TOKEN_PROGRAM_ADDRESS;
    } catch {
      return TOKEN_PROGRAM_ADDRESS;
    }
  };

  async function checkATARequirement(
    values: WithdrawFormData,
  ): Promise<string> {
    const rpc = getRpc();

    try {
      if (
        values.tokenAddress === 'So11111111111111111111111111111111111111112'
      ) {
        return handleWithdraw(values);
      }

      const recipient = address(values.recipientAddress);
      const tokenMint = address(values.tokenAddress);
      const programId = await detectTokenProgram(values.tokenAddress);

      const [receiverATA] = await findAssociatedTokenPda({
        mint: tokenMint,
        owner: recipient,
        tokenProgram: programId,
      });

      const receiverATAInfo = await rpc
        .getAccountInfo(receiverATA, { encoding: 'base64' })
        .send();

      if (!receiverATAInfo.value) {
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
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Unknown address validation error';

      let errorMessage =
        'Invalid destination address. Please paste a valid Solana address.';
      if (message.includes('Non-base58') || message.includes('base58')) {
        errorMessage =
          'The destination address contains invalid characters. Please ensure it is a valid base58 Solana address.';
      }

      toast.error(errorMessage);
      log.error(
        `Withdrawal precheck failed: ${message}, userId: ${user?.id}, amount: ${values.amount}, destinationAddress: ${values.recipientAddress}, token: ${values.tokenAddress}`,
      );
      posthog.capture('withdraw_failed');
      setView('withdraw');
      return Promise.reject(new Error('Withdrawal precheck failed'));
    }
  }

  async function handleWithdraw(values: WithdrawFormData) {
    if (isProcessing) return '';

    const userWalletAddress = user?.walletAddress;
    const earnWallet = wallets.find(
      (wallet) => wallet.address === userWalletAddress,
    );

    if (!userWalletAddress || !earnWallet) {
      toast.error(
        'Wallet mismatch. Please contact support@superteamearn.com to resolve this issue.',
      );
      log.error(
        `Withdrawal wallet mismatch: userId: ${user?.id}, userWalletAddress: ${userWalletAddress ?? 'missing'}, availableWallets: ${wallets
          .map((wallet) => wallet.address)
          .join(',')}`,
      );
      setView('withdraw');
      return Promise.reject(new Error('Wallet mismatch'));
    }

    setIsProcessing(true);
    const rpc = getRpc();
    let signature = '';

    try {
      const response = await api.post('/api/wallet/create-signed-transaction', {
        recipientAddress: values.recipientAddress,
        amount: values.amount,
        tokenAddress: values.tokenAddress,
      });

      const serializedTransaction = response.data.serializedTransaction;
      const transactionBytes = Buffer.from(serializedTransaction, 'base64');

      try {
        const simulation = await rpc
          .simulateTransaction(serializedTransaction, {
            sigVerify: false,
            replaceRecentBlockhash: true,
            commitment: 'confirmed',
          })
          .send();
        if (simulation.value.err) {
          throw new Error(
            `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
          );
        }
      } catch (simError) {
        if (
          simError instanceof Error &&
          simError.message.includes('Simulation failed')
        ) {
          throw simError;
        }
      }

      const result = await signAndSendTransaction({
        wallet: earnWallet,
        transaction: transactionBytes,
        chain: 'solana:mainnet',
      });

      signature = bs58.encode(result.signature);

      for (let i = 0; i < 30; i++) {
        const status = await rpc
          .getSignatureStatuses([signature as Signature])
          .send();
        if (
          status.value[0]?.confirmationStatus === 'confirmed' ||
          status.value[0]?.confirmationStatus === 'finalized'
        ) {
          break;
        }
        if (status.value[0]?.err) {
          throw new Error('Transaction failed on-chain');
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      setTxData({
        signature,
        ...values,
        timestamp: Date.now(),
        type: 'Withdrawn',
      });

      await queryClient.invalidateQueries({ queryKey: ['wallet', 'assets'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'activity'] });

      posthog.capture('withdraw_complete');
      setView('success');

      return signature;
    } catch (e) {
      log.error(
        `Withdrawal failed: ${String(e)}, userId: ${user?.id}, amount: ${values.amount}, destinationAddress: ${values.recipientAddress}, token: ${values.tokenAddress}, signature: ${signature}`,
      );

      const errorMessage = (e as Error)?.message?.toLowerCase() || '';
      const isAxiosErr = isAxiosError(e);
      const errorType = classifySolanaError(e);
      const tokenSymbol = selectedToken?.tokenSymbol ?? 'token';

      if (
        errorMessage.includes('mfa canceled') ||
        errorMessage.includes('mfa cancelled')
      ) {
        toast.error('Please complete two-factor authentication to withdraw');
        posthog.capture('mfa cancelled_withdraw');
      } else if (errorMessage.includes('max mfa verification attempts')) {
        toast.error('Maximum MFA attempts reached. Please try again later.');
        posthog.capture('mfa_max_attempts_reached');
      } else if (
        isAxiosErr &&
        e.response?.data?.error === 'Invalid token selected'
      ) {
        toast.error(
          "We don't support this token yet. Contact support@superteamearn.com for us to add it.",
        );
        posthog.capture('withdraw_unsupported_token');
      } else {
        switch (errorType) {
          case 'user-rejected':
            toast.error('Transaction cancelled in wallet.');
            break;
          case 'expired':
            toast.error('Blockhash expired. Transaction not sent.');
            break;
          case 'insufficient-funds':
          case 'token-not-available':
            toast.error(
              `Insufficient ${tokenSymbol} or SOL balance. Please add funds and try again.`,
            );
            break;
          case 'timeout':
            toast.info(
              signature
                ? 'Transaction may still confirm. Check explorer before retrying.'
                : 'Network congestion. Please check your wallet history before retrying.',
            );
            break;
          case 'rpc':
          case 'unknown':
          default:
            toast.error(
              'Something went wrong. Please try again. If the issue persists, contact support@superteamearn.com.',
            );
            break;
        }
      }

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
