import { zodResolver } from '@hookform/resolvers/zod';
import {
  useSignAndSendTransaction,
  useWallets,
} from '@privy-io/react-auth/solana';
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import bs58 from 'bs58';
import { log } from 'next-axiom';
import posthog from 'posthog-js';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { tokenList } from '@/constants/tokenList';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import {
  classifySolanaError,
  cleanupTransactionGuards,
  createTransactionGuard,
  handleSolanaError,
  updateTransactionGuard,
  waitForTransactionConfirmation,
} from '@/utils/solanaTransactionHelpers';

import { type TokenAsset } from '../../types/TokenAsset';
import { type TxData } from '../../types/TxData';
import { type DrawerView } from '../../types/WalletTypes';
import { fetchTokenUSDValue } from '../../utils/fetchTokenUSDValue';
import { getConnection } from '../../utils/getConnection';
import {
  type WithdrawFormData,
  withdrawFormSchema,
} from '../../utils/withdrawFormSchema';
import { ATAConfirmation } from './ATAConfirmation';
import { TransactionDetails } from './TransactionDetails';
import { WithdrawForm } from './WithdrawForm';

const tokenProgramCache: Record<string, string> = {};

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

  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const isToken2022Token = useCallback(
    async (connection: any, mintAddress: string): Promise<boolean> => {
      if (mintAddress === 'So11111111111111111111111111111111111111112') {
        return false;
      }
      if (tokenProgramCache[mintAddress]) {
        const isToken2022 =
          tokenProgramCache[mintAddress] === TOKEN_2022_PROGRAM_ID.toString();
        return isToken2022;
      }

      try {
        const mintInfo = await connection.getAccountInfo(
          new PublicKey(mintAddress),
        );

        if (!mintInfo) {
          console.error(
            `[isToken2022Token] Mint account not found: ${mintAddress}`,
          );
          return false;
        }

        const ownerString = mintInfo.owner.toString();
        tokenProgramCache[mintAddress] = ownerString;

        const isToken2022 = ownerString === TOKEN_2022_PROGRAM_ID.toString();
        return isToken2022;
      } catch (error) {
        console.error(
          `[isToken2022Token] Error checking token program:`,
          error,
        );
        return false;
      }
    },
    [],
  );

  async function checkATARequirement(
    values: WithdrawFormData,
  ): Promise<string> {
    const connection = getConnection('confirmed');

    try {
      const recipient = new PublicKey(values.recipientAddress);
      const tokenMint = new PublicKey(values.tokenAddress);

      if (
        values.tokenAddress === 'So11111111111111111111111111111111111111112'
      ) {
        return handleWithdraw(values);
      }

      const isToken2022 = await isToken2022Token(
        connection,
        values.tokenAddress,
      );
      const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      const receiverATA = getAssociatedTokenAddressSync(
        tokenMint,
        recipient,
        true,
        programId,
      );

      const receiverATAExists =
        !!(await connection.getAccountInfo(receiverATA));
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
    setIsProcessing(true);

    let signature: string = '';

    try {
      const guardKey = `withdraw:${user?.id ?? 'anon'}:${values.tokenAddress}:${values.amount}:${values.recipientAddress}`;
      if (
        !createTransactionGuard({
          guardKey,
          inFlightMessage: 'A similar withdrawal is already in progress.',
        })
      ) {
        return '';
      }

      const connection = getConnection('confirmed');

      const response = await api.post('/api/wallet/create-signed-transaction', {
        recipientAddress: values.recipientAddress,
        amount: values.amount,
        tokenAddress: values.tokenAddress,
      });

      const transaction = VersionedTransaction.deserialize(
        Buffer.from(response.data.serializedTransaction, 'base64'),
      );

      try {
        const simulation = await connection.simulateTransaction(transaction, {
          sigVerify: false,
          replaceRecentBlockhash: true,
        });
        if (simulation.value.err) {
          log.error(
            `[handleWithdraw] Simulation failed for user ${user?.id}: ${JSON.stringify(simulation.value.err)}, logs: ${simulation.value.logs?.join('\n')}`,
          );
          throw new Error(
            `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`,
          );
        }
        log.info(
          `[handleWithdraw] Simulation passed for user ${user?.id}, units consumed: ${simulation.value.unitsConsumed}`,
        );
      } catch (simError) {
        if (
          simError instanceof Error &&
          simError.message.includes('simulation failed')
        ) {
          throw simError;
        }
        log.warn(
          `[handleWithdraw] Simulation check failed (non-fatal): ${String(simError)}`,
        );
      }

      const wallet = wallets[0];
      if (!wallet) throw new Error('No wallet found');

      log.info(
        `[handleWithdraw] Sending transaction for user ${user?.id}, wallet: ${wallet.address}`,
      );

      let result;
      try {
        result = await signAndSendTransaction({
          wallet,
          transaction: transaction.serialize(),
          chain: 'solana:mainnet',
        });
      } catch (sendError) {
        log.error(
          `[handleWithdraw] signAndSendTransaction failed for user ${user?.id}: ${String(sendError)}`,
        );
        throw sendError;
      }

      signature = bs58.encode(result.signature);
      log.info(
        `[handleWithdraw] Transaction sent for user ${user?.id}, signature: ${signature}`,
      );
      updateTransactionGuard(guardKey, signature);
      setLastSignature(signature);

      try {
        await waitForTransactionConfirmation({
          connection,
          signature,
          maxRetries: 60,
          retryDelayMs: 500,
        });
        log.info(
          `[handleWithdraw] Transaction confirmed for user ${user?.id}, signature: ${signature}`,
        );
      } catch (e) {
        const status = await connection.getSignatureStatus(signature);
        log.error(
          `[handleWithdraw] Transaction polling failed for user ${user?.id}, signature: ${signature}, finalStatus: ${JSON.stringify(status?.value)}, error: ${String(e)}`,
        );
        console.error('[handleWithdraw] Transaction polling failed:', e);
        throw new Error(
          `Transaction confirmation timed out. Signature: ${signature}. Check Solscan before retrying.`,
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
      const isMfaCancelled =
        e instanceof Error &&
        (e.message === 'MFA canceled' || e.message === 'MFA cancelled');

      const maxMFAttemptsReached =
        e instanceof Error &&
        e.message.includes('Max MFA verification attempts reached');

      const isUnsupportedToken =
        isAxiosError(e) && e.response?.data?.error === 'Invalid token selected';

      if (isMfaCancelled) {
        console.error('[handleWithdraw] MFA authentication cancelled by user.');
        posthog.capture('mfa cancelled_withdraw');
      } else if (maxMFAttemptsReached) {
        console.error('[handleWithdraw] Max MFA verification attempts reached');
        posthog.capture('mfa_max_attempts_reached');
      } else if (isUnsupportedToken) {
        console.error('[handleWithdraw] Unsupported token selected');
        posthog.capture('withdraw_unsupported_token');
      } else {
        console.error('[handleWithdraw] Withdrawal failed:', e);
        posthog.capture('withdraw_failed');
      }

      log.error(
        `Withdrawal failed: ${String(e)}, userId: ${user?.id}, amount: ${values.amount}, destinationAddress: ${values.recipientAddress}, token: ${values.tokenAddress}, signature: ${signature}`,
      );

      if (isMfaCancelled) {
        const msg = 'Please complete two-factor authentication to withdraw';
        toast.error(msg);
      } else if (isUnsupportedToken) {
        const msg =
          "We don't support this token yet. Contact support@superteamearn.com for us to add it.";
        toast.error(msg);
      } else {
        const errorType = classifySolanaError(e);
        const tokenSymbol =
          selectedToken?.tokenSymbol ??
          (values.tokenAddress === 'So11111111111111111111111111111111111111112'
            ? 'SOL'
            : 'token');

        handleSolanaError({
          errorType,
          lastSignature,
          tokenSymbol,
          customMessages: {
            userRejected: 'Payment cancelled in wallet.',
            expired: 'Blockhash expired. Payment not sent.',
            unknown:
              'Something went wrong. Please try again. If the issue persists, contact support at support@superteamearn.com.',
          },
        });
      }

      setView('withdraw');
      return Promise.reject(new Error('Transaction failed'));
    } finally {
      setIsProcessing(false);
      cleanupTransactionGuards('withdraw:');
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
