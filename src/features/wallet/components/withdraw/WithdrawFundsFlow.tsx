import { zodResolver } from '@hookform/resolvers/zod';
import {
  useSignAndSendTransaction,
  useWallets,
} from '@privy-io/react-auth/solana';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { address, type Signature } from '@solana/kit';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import bs58 from 'bs58';
import { log } from 'next-axiom';
import posthog from 'posthog-js';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getTokenBySymbol } from '@/constants/tokenList';
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

interface WithdrawalApiErrorResponse {
  code?: string;
  error?: string;
}

const SUPPORT_ERROR_MESSAGE =
  'Something went wrong. Please try again. If the issue persists, contact support@superteam.fun.';

const actionableWithdrawalErrorCodes = new Set([
  'AMOUNT_BELOW_ACCOUNT_SETUP_FEE',
  'AMOUNT_TOO_SMALL',
  'AUTHENTICATION_REQUIRED',
  'INVALID_WITHDRAWAL_DETAILS',
  'UNSUPPORTED_TOKEN',
  'WITHDRAWAL_NOT_ALLOWED',
]);

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

        const tokenDetails = await getTokenBySymbol(selectedToken?.tokenSymbol);
        const power = tokenDetails?.decimals;
        if (
          !Number.isFinite(tokenUSDValue) ||
          tokenUSDValue <= 0 ||
          !Number.isFinite(solUSDValue) ||
          solUSDValue <= 0 ||
          power === undefined
        ) {
          throw new Error('Unable to calculate token account setup fee');
        }
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

      const isInvalidAddress =
        message.includes('Non-base58') ||
        message.includes('base58') ||
        message.toLowerCase().includes('invalid address');

      const errorMessage = isInvalidAddress
        ? 'The destination address is invalid. Please enter a valid Solana wallet address.'
        : SUPPORT_ERROR_MESSAGE;

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
        'Wallet mismatch. Please contact support@superteam.fun to resolve this issue.',
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
          const simulationLogs = simulation.value.logs?.join('\n');
          throw new Error(
            `Simulation failed: ${JSON.stringify(simulation.value.err)}${simulationLogs ? `\n${simulationLogs}` : ''}`,
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

      let transactionConfirmed = false;
      for (let i = 0; i < 30; i++) {
        const status = await rpc
          .getSignatureStatuses([signature as Signature])
          .send();
        const transactionStatus = status.value[0];

        if (transactionStatus?.err) {
          throw new Error('Transaction failed on-chain');
        }
        if (
          transactionStatus?.confirmationStatus === 'confirmed' ||
          transactionStatus?.confirmationStatus === 'finalized'
        ) {
          transactionConfirmed = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (!transactionConfirmed) {
        throw new Error('Transaction confirmation timed out');
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
      const apiError = isAxiosErr
        ? (e.response?.data as WithdrawalApiErrorResponse | undefined)
        : undefined;
      const errorType = classifySolanaError(e);
      const tokenSymbol = selectedToken?.tokenSymbol ?? 'token';

      if (
        apiError?.code &&
        actionableWithdrawalErrorCodes.has(apiError.code) &&
        apiError.error
      ) {
        toast.error(apiError.error);
        posthog.capture('withdraw_request_rejected', {
          code: apiError.code,
        });
      } else if (
        errorMessage.includes('mfa canceled') ||
        errorMessage.includes('mfa cancelled')
      ) {
        toast.error('Please complete two-factor authentication to withdraw');
        posthog.capture('mfa cancelled_withdraw');
      } else if (errorMessage.includes('max mfa verification attempts')) {
        toast.error('Maximum MFA attempts reached. Please try again later.');
        posthog.capture('mfa_max_attempts_reached');
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
            toast.error(SUPPORT_ERROR_MESSAGE);
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
