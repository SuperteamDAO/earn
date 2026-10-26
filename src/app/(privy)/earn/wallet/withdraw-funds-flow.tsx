'use client';

import {
  useSignAndSendTransaction,
  useWallets,
} from '@privy-io/react-auth/solana';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import {
  address,
  type Address,
  type Base64EncodedWireTransaction,
  createSolanaRpc,
  getBase64Encoder,
  signature as toSignature,
} from '@solana/kit';
import bs58 from 'bs58';
import { posthog } from 'posthog-js';
import { useState } from 'react';
import { type Resolver, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { getJson, postJson, RequestError } from '@/lib/fetch-json';
import { publicEnv } from '@/lib/public-env';
import { useViewer } from '@/lib/viewer';
import { classifySolanaError } from '@/utils/solanaTransactionHelpers';

import { ATAConfirmation } from '@/features/wallet/components/withdraw/ATAConfirmation';
import { TransactionDetails } from '@/features/wallet/components/withdraw/TransactionDetails';
import { WithdrawForm } from '@/features/wallet/components/withdraw/WithdrawForm';
import type { TokenAsset } from '@/features/wallet/types/TokenAsset';
import type { TxData } from '@/features/wallet/types/TxData';
import type { DrawerView } from '@/features/wallet/types/WalletTypes';
import {
  type WithdrawFormData,
  withdrawalErrors,
} from '@/features/wallet/utils/withdrawal';

// Earn's RPC, which the browser simulates against and polls for
// confirmation (the page's CSP allows it).
let rpcInstance: ReturnType<typeof createSolanaRpc> | null = null;
function getRpc() {
  rpcInstance ??= createSolanaRpc(`https://${publicEnv.rpcUrl}`);
  return rpcInstance;
}

async function fetchTokenUSDValue(mintAddress: string): Promise<number> {
  const { price } = await getJson<{ price: number }>(
    `/api/wallet/price/?mintAddress=${encodeURIComponent(mintAddress)}`,
  );
  return price;
}

async function detectTokenProgram(mintAddress: string) {
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
}

// The same checks the server makes, as react-hook-form's resolver.
const resolver: Resolver<WithdrawFormData> = (values) => {
  const errors = withdrawalErrors(values);
  const entries = Object.entries(errors);
  if (entries.length === 0) return { values, errors: {} };
  return {
    values: {},
    errors: Object.fromEntries(
      entries.map(([field, message]) => [field, { type: 'validate', message }]),
    ),
  };
};

interface WithdrawFlowProps {
  tokens: TokenAsset[];
  view: DrawerView;
  setView: (view: DrawerView) => void;
  txData: TxData;
  setTxData: (txData: TxData) => void;
  // Reloads balances and activity after a withdrawal.
  onWithdrawn: () => Promise<void>;
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
  onWithdrawn,
}: WithdrawFlowProps) {
  const user = useViewer();

  const [isProcessing, setIsProcessing] = useState(false);
  const [ataCreationCost, setAtaCreationCost] = useState<number>(0);
  const [pendingFormData, setPendingFormData] =
    useState<WithdrawFormData | null>(null);

  const { wallets } = useWallets();
  const sender = useSignAndSendTransaction();

  const form = useForm<WithdrawFormData>({
    resolver,
    defaultValues: {
      tokenAddress: tokens[0]?.tokenAddress ?? '',
      amount: '',
      recipientAddress: '',
    },
  });

  const tokenAddress = useWatch({
    control: form.control,
    name: 'tokenAddress',
  });
  const selectedToken = tokens.find(
    (token) => token.tokenAddress === tokenAddress,
  );

  async function checkATARequirement(
    values: WithdrawFormData,
  ): Promise<string> {
    const rpc = getRpc();
    let recipient: Address;

    try {
      recipient = address(values.recipientAddress);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Unknown address validation error';

      toast.error(
        'The destination address is invalid. Please enter a valid Solana wallet address.',
      );
      console.error(
        `Withdrawal recipient validation failed: ${message}, userId: ${user?.id}, amount: ${values.amount}, destinationAddress: ${values.recipientAddress}, token: ${values.tokenAddress}`,
      );
      posthog.capture('withdraw_failed');
      setView('withdraw');
      return Promise.reject(new Error('Withdrawal precheck failed'));
    }

    try {
      if (
        values.tokenAddress === 'So11111111111111111111111111111111111111112'
      ) {
        return handleWithdraw(values);
      }

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

        const power = selectedToken?.decimals;
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
        e instanceof Error ? e.message : 'Unknown withdrawal precheck error';

      toast.error(SUPPORT_ERROR_MESSAGE);
      console.error(
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
      console.error(
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
      const { serializedTransaction } = await postJson<{
        serializedTransaction: string;
      }>('/api/wallet/create-signed-transaction/', {
        recipientAddress: values.recipientAddress,
        amount: values.amount,
        tokenAddress: values.tokenAddress,
      });

      const transactionBytes = new Uint8Array(
        getBase64Encoder().encode(serializedTransaction),
      );

      try {
        const simulation = await rpc
          .simulateTransaction(
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            serializedTransaction as Base64EncodedWireTransaction,
            {
              encoding: 'base64',
              sigVerify: false,
              replaceRecentBlockhash: true,
              commitment: 'confirmed',
            },
          )
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

      const result = await sender.signAndSendTransaction({
        wallet: earnWallet,
        transaction: transactionBytes,
        chain: 'solana:mainnet',
      });

      signature = bs58.encode(result.signature);

      let transactionConfirmed = false;
      for (let i = 0; i < 30; i++) {
        const status = await rpc
          .getSignatureStatuses([toSignature(signature)])
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
        tokenSymbol: selectedToken?.tokenSymbol ?? '',
        tokenImg: selectedToken?.tokenImg ?? '',
      });

      await onWithdrawn();

      posthog.capture('withdraw_complete');
      setView('success');

      return signature;
    } catch (e) {
      console.error(
        `Withdrawal failed: ${String(e)}, userId: ${user?.id}, amount: ${values.amount}, destinationAddress: ${values.recipientAddress}, token: ${values.tokenAddress}, signature: ${signature}`,
      );

      const errorMessage = e instanceof Error ? e.message.toLowerCase() : '';
      const apiError =
        e instanceof RequestError
          ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            (e.body as WithdrawalApiErrorResponse | null)
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
          onConfirm={() => void handleWithdraw(pendingFormData).catch(() => {})}
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
