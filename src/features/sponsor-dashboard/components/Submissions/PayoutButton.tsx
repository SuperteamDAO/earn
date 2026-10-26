'use client';

import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import { getTransferSolInstruction } from '@solana-program/system';
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import {
  getTransferCheckedInstruction as getTransferCheckedInstruction2022,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '@solana-program/token-2022';
import {
  type Address,
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createSolanaRpc,
  createTransactionMessage,
  getTransactionEncoder,
  type Instruction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signature as toSignature,
  type TransactionSigner,
} from '@solana/kit';
import { useWallet } from '@solana/wallet-adapter-react';
import type {
  SolanaSignAndSendTransactionFeature,
  SolanaSignAndSendTransactionInput,
} from '@solana/wallet-standard-features';
import bs58 from 'bs58';
import { Loader2 } from 'lucide-react';
import { log } from 'next-axiom';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { getTokenBySymbol } from '@/constants/tokenList';
import { postJson } from '@/lib/fetch-json';
import { publicEnv } from '@/lib/public-env';
import { useViewer } from '@/lib/viewer';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import {
  classifySolanaError,
  handleSolanaError,
} from '@/utils/solanaTransactionHelpers';
import { toBaseUnits } from '@/utils/to-base-units';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import type {
  ReviewListing,
  ReviewPayment,
  ReviewSubmission,
} from '../../utils/review-rules';
import { useReview } from './review-state';

const payoutsInFlight = new Set<string>();

const getRpc = () => createSolanaRpc(`https://${publicEnv.rpcUrl}`);

type SignAndSend =
  SolanaSignAndSendTransactionFeature['solana:signAndSendTransaction'];
type WalletAccount = SolanaSignAndSendTransactionInput['account'];

interface StandardWallet {
  readonly features: Readonly<Record<string, unknown>>;
  readonly accounts: ReadonlyArray<WalletAccount>;
}

// The Wallet Standard wallet behind an adapter, when it is one.
const isStandardWallet = (value: unknown): value is StandardWallet =>
  typeof value === 'object' &&
  value !== null &&
  'features' in value &&
  'accounts' in value &&
  Array.isArray(value.accounts);

const isSignAndSend = (value: unknown): value is SignAndSend =>
  typeof value === 'object' &&
  value !== null &&
  'signAndSendTransaction' in value &&
  typeof value.signAndSendTransaction === 'function';

const DynamicWalletMultiButton = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false },
);

const detectTokenProgram = async (mintAddress: string): Promise<Address> => {
  const rpc = getRpc();
  try {
    const accountInfo = await rpc
      .getAccountInfo(address(mintAddress), { encoding: 'base64' })
      .send();
    if (accountInfo.value?.owner === TOKEN_2022_PROGRAM_ADDRESS) {
      return TOKEN_2022_PROGRAM_ADDRESS;
    }
    return TOKEN_PROGRAM_ADDRESS;
  } catch {
    return TOKEN_PROGRAM_ADDRESS;
  }
};

interface Props {
  bounty: ReviewListing | null;
  submission: ReviewSubmission;
}

export const PayoutButton = ({ bounty, submission }: Props) => {
  const [isPaying, setIsPaying] = useState(false);
  const [warning, setWarning] = useState<{
    firstName: string;
    signature?: string;
  } | null>(null);

  const user = useViewer();
  const router = useRouter();
  const { updateSubmissions } = useReview();
  const { connected, publicKey, wallet } = useWallet();

  const totalPrizeAmount =
    bounty?.rewards?.[String(submission.winnerPosition)] || 0;

  const totalPaidAmount =
    submission?.paymentDetails?.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    ) || 0;

  const remainingAmount = totalPrizeAmount - totalPaidAmount;

  const addPayment = async ({
    id,
    paymentDetails,
  }: {
    id: string;
    paymentDetails: ReadonlyArray<ReviewPayment>;
  }) => {
    try {
      const updatedSubmission = await postJson<{
        isPaid: boolean;
        paymentDetails: ReadonlyArray<ReviewPayment>;
      }>('/api/sponsor-dashboard/submission/add-payment/', {
        id,
        paymentDetails,
      });
      updateSubmissions((sub) =>
        sub.id === id
          ? {
              ...sub,
              isPaid: updatedSubmission.isPaid,
              paymentDetails: updatedSubmission.paymentDetails,
            }
          : sub,
      );
      router.refresh();
    } catch (error) {
      console.error('Payment record update failed', error);
      throw error;
    }
  };

  const handlePayout = async ({
    id,
    token,
    amount,
    receiver,
  }: {
    id: string;
    token: string;
    amount: number;
    receiver: Address;
  }) => {
    if (!publicKey || !wallet) {
      console.error('Wallet not connected');
      return;
    }

    if (payoutsInFlight.has(id)) {
      console.warn('Payout already in progress for this submission');
      return;
    }

    payoutsInFlight.add(id);
    setIsPaying(true);
    const rpc = getRpc();
    let txSignature = '';
    let payoutStage:
      | 'start'
      | 'resolve-token'
      | 'build-instructions'
      | 'fetch-blockhash'
      | 'wallet-sign-and-send'
      | 'confirm-transaction'
      | 'persist-payment'
      | 'completed' = 'start';

    log.info(
      `[PayoutFlow] Starting payout, submission id: ${id}, user id: ${user?.id}, sponsor id: ${user?.currentSponsorId}, sponsor wallet: ${publicKey?.toBase58()}, winner wallet: ${receiver}, token: ${token}, amount: ${amount}`,
    );

    try {
      const senderAddress = address(publicKey.toBase58());
      const senderSigner: TransactionSigner = createNoopSigner(senderAddress);
      payoutStage = 'resolve-token';
      const tokenDetails = await getTokenBySymbol(token);

      payoutStage = 'build-instructions';
      const instructions: Instruction[] = [
        getSetComputeUnitLimitInstruction({ units: 200_000 }),
        getSetComputeUnitPriceInstruction({ microLamports: 50_000n }),
      ];

      if (token === 'SOL') {
        instructions.push(
          getTransferSolInstruction({
            source: senderSigner,
            destination: receiver,
            amount: toBaseUnits(String(amount), 9),
          }),
        );
      } else {
        if (!tokenDetails) throw new Error(`Unknown token ${token}`);
        const { mintAddress, decimals } = tokenDetails;
        const mint = address(mintAddress);
        const tokenProgramId = await detectTokenProgram(mintAddress);
        const isToken2022 = tokenProgramId === TOKEN_2022_PROGRAM_ADDRESS;

        const [senderATA] = await findAssociatedTokenPda({
          mint,
          owner: senderAddress,
          tokenProgram: tokenProgramId,
        });
        const [receiverATA] = await findAssociatedTokenPda({
          mint,
          owner: receiver,
          tokenProgram: tokenProgramId,
        });

        instructions.push(
          getCreateAssociatedTokenIdempotentInstruction({
            payer: senderSigner,
            ata: receiverATA,
            owner: receiver,
            mint,
            tokenProgram: tokenProgramId,
          }),
          isToken2022
            ? getTransferCheckedInstruction2022({
                source: senderATA,
                mint,
                destination: receiverATA,
                authority: senderSigner,
                amount: toBaseUnits(String(amount), decimals),
                decimals,
              })
            : getTransferCheckedInstruction(
                {
                  source: senderATA,
                  mint,
                  destination: receiverATA,
                  authority: senderSigner,
                  amount: toBaseUnits(String(amount), decimals),
                  decimals,
                },
                { programAddress: tokenProgramId },
              ),
        );
      }

      payoutStage = 'fetch-blockhash';
      const { value: latestBlockhash } = await rpc
        .getLatestBlockhash({ commitment: 'confirmed' })
        .send();

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(senderSigner, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions(instructions, tx),
      );

      const compiledTx = compileTransaction(transactionMessage);
      const txEncoder = getTransactionEncoder();
      const txBytes = txEncoder.encode(compiledTx);

      const standardWallet: unknown = Reflect.get(wallet.adapter, 'wallet');

      if (!isStandardWallet(standardWallet)) {
        throw new Error('Wallet not available');
      }

      const account =
        standardWallet.accounts.find(
          (item) => item.address === publicKey.toBase58(),
        ) ?? standardWallet.accounts[0];

      if (!account) {
        throw new Error('Wallet not available');
      }

      const signAndSend =
        standardWallet.features['solana:signAndSendTransaction'];

      if (!isSignAndSend(signAndSend)) {
        throw new Error('Wallet does not support signAndSendTransaction');
      }

      payoutStage = 'wallet-sign-and-send';
      const results = await signAndSend.signAndSendTransaction({
        account,
        transaction: new Uint8Array(txBytes),
        chain: 'solana:mainnet',
        options: { skipPreflight: true },
      });

      const result = results[0];
      if (!result) throw new Error('Wallet returned no signature');
      txSignature = bs58.encode(result.signature);

      payoutStage = 'confirm-transaction';
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        const status = await rpc
          .getSignatureStatuses([toSignature(txSignature)])
          .send();
        if (
          status.value[0]?.confirmationStatus === 'confirmed' ||
          status.value[0]?.confirmationStatus === 'finalized'
        ) {
          confirmed = true;
          break;
        }
        if (status.value[0]?.err) {
          throw new Error('Transaction failed on-chain');
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (!confirmed) {
        throw new Error('Transaction confirmation timeout');
      }

      payoutStage = 'persist-payment';
      await addPayment({
        id,
        paymentDetails: [
          {
            txId: txSignature,
            amount,
            tranche: 1,
          },
        ],
      });
      payoutStage = 'completed';
      log.info(
        `[PayoutFlow] Payout completed, submission id: ${id}, user id: ${user?.id}, sponsor id: ${user?.currentSponsorId}, tx signature: ${txSignature}`,
      );
    } catch (error) {
      const failedAt = payoutStage;
      log.error(
        `Sponsor unable to pay, user id: ${user?.id}, sponsor id: ${user?.currentSponsorId}, submission id: ${id}, stage: ${failedAt}, tx signature: ${txSignature || 'none'}, error: ${error?.toString()}, sponsor wallet: ${publicKey?.toBase58()}`,
      );

      const firstName: string = (() => {
        const name = submission.user.firstName || 'the winner';
        return typeof name === 'string' && name.trim().length > 0
          ? (name.trim().split(' ')[0] ?? 'the winner')
          : 'the winner';
      })();

      const errorType = classifySolanaError(error);
      const tokenSymbol = bounty?.token ?? 'token';

      handleSolanaError({
        errorType,
        lastSignature: txSignature || null,
        tokenSymbol,
        customMessages: {
          userRejected: 'Payment cancelled in wallet.',
          expired: 'Blockhash expired. Payment not sent.',
        },
      });

      // Cancelled in the wallet: nothing was sent.
      if (errorType === 'user-rejected') return;
      if (errorType === 'timeout' || errorType === 'rpc') {
        setWarning({ firstName, signature: txSignature || undefined });
      } else if (txSignature) {
        setWarning({ firstName, signature: txSignature });
      } else {
        setWarning({ firstName });
      }
    } finally {
      payoutsInFlight.delete(id);
      setIsPaying(false);
    }
  };

  return (
    <>
      <div
        className="ph-no-capture wallet-payout-button"
        onClick={() => {
          posthog.capture('connect wallet_payment');
        }}
      >
        {!connected && (
          <DynamicWalletMultiButton
            style={{
              height: '40px',
              minWidth: '160px',
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 600,
              fontFamily: 'Inter',
              paddingRight: '20px',
              paddingLeft: '20px',
              fontSize: '14px',
            }}
          >
            {connected
              ? truncatePublicKey(publicKey?.toBase58(), 3)
              : `Pay ${
                  formatNumberWithSuffix(remainingAmount, 2, true) || '0'
                } ${bounty?.token}`}
          </DynamicWalletMultiButton>
        )}
      </div>
      {connected && (
        <Button
          className="ph-no-capture min-w-[160px] text-center disabled:cursor-not-allowed"
          disabled={
            !bounty?.isWinnersAnnounced || remainingAmount <= 0 || isPaying
          }
          onClick={() => {
            if (!submission?.user.walletAddress) {
              console.error('Public key is null, cannot proceed with payment');
              return;
            }
            posthog.capture('pay winner_sponsor');
            void handlePayout({
              id: submission.id,
              token: bounty?.token ?? 'SOL',
              amount: remainingAmount,
              receiver: address(submission.user.walletAddress),
            });
          }}
          variant="default"
        >
          {isPaying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Paying...</span>
            </>
          ) : (
            `Pay ${
              formatNumberWithSuffix(remainingAmount, 2, true) || '0'
            } ${bounty?.token}`
          )}
        </Button>
      )}
      <AlertDialog
        open={Boolean(warning)}
        onOpenChange={(open) => {
          if (!open) setWarning(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ⚠️ Important: Check your wallet history
            </AlertDialogTitle>
            <AlertDialogDescription>
              {`Your payment to ${warning?.firstName ?? 'the winner'} might have gone through. Please check your wallet history before reattempting to pay ${warning?.firstName ?? 'the winner'}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setWarning(null)}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
