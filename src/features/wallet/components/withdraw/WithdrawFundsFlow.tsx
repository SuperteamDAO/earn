import { zodResolver } from '@hookform/resolvers/zod';
import { useSignTransaction } from '@privy-io/react-auth/solana';
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { log } from 'next-axiom';
import posthog from 'posthog-js';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { tokenList } from '@/constants/tokenList';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

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

  const isToken2022Token = useCallback(
    async (connection: any, mintAddress: string): Promise<boolean> => {
      console.log(`[isToken2022Token] Checking mint: ${mintAddress}`);
      if (mintAddress === 'So11111111111111111111111111111111111111112') {
        console.log('[isToken2022Token] Mint is SOL, returning false.');
        return false;
      }
      if (tokenProgramCache[mintAddress]) {
        const isToken2022 =
          tokenProgramCache[mintAddress] === TOKEN_2022_PROGRAM_ID.toString();
        console.log(
          `[isToken2022Token] Found in cache. Program ID: ${tokenProgramCache[mintAddress]}, Is Token-2022: ${isToken2022}`,
        );
        return isToken2022;
      }
      console.log(
        `[isToken2022Token] Not in cache, fetching account info for ${mintAddress}`,
      );

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
        console.log(`[isToken2022Token] Mint owner: ${ownerString}`);
        tokenProgramCache[mintAddress] = ownerString;

        const isToken2022 = ownerString === TOKEN_2022_PROGRAM_ID.toString();
        console.log(`[isToken2022Token] Is Token-2022: ${isToken2022}`);
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
    console.log('[checkATARequirement] Starting check with values:', values);
    const connection = getConnection('confirmed');

    const recipient = new PublicKey(values.recipientAddress);
    const tokenMint = new PublicKey(values.tokenAddress);

    if (values.tokenAddress === 'So11111111111111111111111111111111111111112') {
      console.log(
        '[checkATARequirement] Token is SOL, proceeding to withdraw.',
      );
      return handleWithdraw(values);
    }

    console.log('[checkATARequirement] Checking if token is Token-2022...');
    const isToken2022 = await isToken2022Token(connection, values.tokenAddress);
    const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    console.log(
      `[checkATARequirement] Is Token-2022: ${isToken2022}, Program ID: ${programId.toString()}`,
    );

    const receiverATA = getAssociatedTokenAddressSync(
      tokenMint,
      recipient,
      false,
      programId,
    );
    console.log(
      `[checkATARequirement] Calculated receiver ATA: ${receiverATA.toString()}`,
    );

    console.log('[checkATARequirement] Checking if receiver ATA exists...');
    const receiverATAExists = !!(await connection.getAccountInfo(receiverATA));
    console.log(
      `[checkATARequirement] Receiver ATA exists: ${receiverATAExists}`,
    );

    if (!receiverATAExists) {
      console.log(
        '[checkATARequirement] Receiver ATA does not exist. Calculating creation cost.',
      );
      const tokenUSDValue = await fetchTokenUSDValue(
        selectedToken?.tokenAddress || '',
      );
      const solUSDValue = await fetchTokenUSDValue(
        'So11111111111111111111111111111111111111112',
      );
      console.log(
        `[checkATARequirement] Token USD Value: ${tokenUSDValue}, SOL USD Value: ${solUSDValue}`,
      );

      const ataCreationCostInUSD = solUSDValue * 0.0021;
      const tokenAmountToCharge = ataCreationCostInUSD / tokenUSDValue;
      console.log(
        `[checkATARequirement] ATA Creation Cost (USD): ${ataCreationCostInUSD}, Token Amount to Charge: ${tokenAmountToCharge}`,
      );

      const tokenDetails = tokenList.find(
        (token) => token.tokenSymbol === selectedToken?.tokenSymbol,
      );
      const power = tokenDetails?.decimals as number;
      const cost = Math.ceil(tokenAmountToCharge * 10 ** power);
      console.log(
        `[checkATARequirement] Token Decimals: ${power}, Calculated Cost (smallest unit): ${cost}`,
      );

      setAtaCreationCost(cost);
      setPendingFormData(values);
      console.log('[checkATARequirement] Setting view to ata-confirm.');
      setView('ata-confirm');
      return '';
    }

    return handleWithdraw(values);
  }

  async function handleWithdraw(values: WithdrawFormData) {
    console.log('[handleWithdraw] Starting withdrawal with values:', values);
    setIsProcessing(true);
    setError('');

    let signature: string | undefined;

    try {
      const connection = getConnection('confirmed');
      console.log('[handleWithdraw] Connection obtained.');

      console.log(
        '[handleWithdraw] Calling API: /api/wallet/create-signed-transaction',
      );
      const response = await api.post('/api/wallet/create-signed-transaction', {
        recipientAddress: values.recipientAddress,
        amount: values.amount,
        tokenAddress: values.tokenAddress,
      });
      console.log(
        '[handleWithdraw] API response received. Serialized transaction length:',
        response.data.serializedTransaction?.length,
      );

      const transaction = VersionedTransaction.deserialize(
        Buffer.from(response.data.serializedTransaction, 'base64'),
      );
      console.log('[handleWithdraw] Transaction deserialized.');

      console.log('[handleWithdraw] Requesting user signature...');
      const userSignedTransaction = await signTransaction({
        transaction,
        connection,
        uiOptions: {
          showWalletUIs: false,
        },
      });
      console.log(
        '[handleWithdraw] User signature obtained. Signed transaction:',
        userSignedTransaction,
      ); // Be careful logging the full object in production

      console.log('[handleWithdraw] Sending raw transaction...');
      signature = await connection.sendRawTransaction(
        userSignedTransaction.serialize(),
      );
      console.log(`[handleWithdraw] Transaction sent. Signature: ${signature}`);

      const pollForSignature = async (sig: string) => {
        console.log(
          `[pollForSignature] Starting polling for signature: ${sig}`,
        );
        const MAX_RETRIES = 60;
        let retries = 0;

        while (retries < MAX_RETRIES) {
          console.log(`[pollForSignature] Retry ${retries + 1}/${MAX_RETRIES}`);
          const status = await connection.getSignatureStatus(sig, {
            searchTransactionHistory: true,
          });
          console.log(`[pollForSignature] Status for ${sig}:`, status?.value);

          if (status?.value?.err) {
            console.error(
              `[pollForSignature] Transaction failed with error:`,
              status.value.err,
            );
            throw new Error(
              `Transaction failed: ${status.value.err.toString()}`,
            );
          }

          if (
            status?.value?.confirmationStatus === 'confirmed' ||
            status.value?.confirmationStatus === 'finalized'
          ) {
            console.log(
              `[pollForSignature] Transaction ${status.value.confirmationStatus}! Signature: ${sig}`,
            );
            return true;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
          retries++;
        }

        console.error(
          `[pollForSignature] Transaction confirmation timeout after ${MAX_RETRIES} retries. Signature: ${sig}`,
        );
        throw new Error('Transaction confirmation timeout');
      };

      console.log(`[handleWithdraw] Polling for signature: ${signature}`);
      try {
        await pollForSignature(signature);
        console.log(`[handleWithdraw] Signature ${signature} confirmed.`);
      } catch (e) {
        console.error('[handleWithdraw] Transaction polling failed:', e);
        throw new Error(
          'Transaction might have gone through, check before proceeding',
        );
      }

      console.log('[handleWithdraw] Setting transaction data...');
      setTxData({
        signature,
        ...values,
        timestamp: Date.now(),
        type: 'Withdrawn',
      });
      console.log('[handleWithdraw] Invalidating queries...');
      await queryClient.invalidateQueries({
        queryKey: ['wallet', 'assets'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['wallet', 'activity'],
      });
      console.log(
        '[handleWithdraw] Capturing PostHog event: withdraw_complete',
      );
      posthog.capture('withdraw_complete');
      console.log('[handleWithdraw] Setting view to success.');
      setView('success');

      return signature;
    } catch (e) {
      const isMfaCancelled =
        e instanceof Error &&
        (e.message === 'MFA canceled' || e.message === 'MFA cancelled');

      const isUnsupportedToken =
        isAxiosError(e) && e.response?.data?.error === 'Invalid token selected';

      if (isMfaCancelled) {
        console.error('[handleWithdraw] MFA authentication cancelled by user.');
        posthog.capture('mfa cancelled_withdraw');
      } else if (isUnsupportedToken) {
        console.error('[handleWithdraw] Unsupported token selected');
        posthog.capture('withdraw_unsupported_token');
      } else {
        console.error('[handleWithdraw] Withdrawal failed:', e);
        posthog.capture('withdraw_failed');

        log.error(
          `Withdrawal failed: ${e}, userId: ${user?.id}, amount: ${values.amount}, destinationAddress: ${values.recipientAddress}, token: ${values.tokenAddress}, signature: ${signature}`,
        );
      }

      let errorMessage =
        'Something went wrong. Please try again. If the issue persists, contact support at support@superteamearn.com.';

      if (isMfaCancelled) {
        errorMessage = 'Please complete two-factor authentication to withdraw';
      } else if (isUnsupportedToken) {
        errorMessage =
          "We don't support this token yet. Contact support@superteamearn.com for us to add it.";
      }

      console.log(`[handleWithdraw] Setting error state: "${errorMessage}"`);
      setError(errorMessage);
      toast.error(errorMessage);
      console.log(error);
      setView('withdraw');
      return Promise.reject(new Error('Transaction failed'));
    } finally {
      console.log('[handleWithdraw] Executing finally block.');
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
