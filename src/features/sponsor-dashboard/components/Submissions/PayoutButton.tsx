import {
  type Address,
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
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
import type { SolanaSignAndSendTransactionFeature } from '@solana/wallet-standard-features';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import bs58 from 'bs58';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { log } from 'next-axiom';
import posthog from 'posthog-js';
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
import { tokenList } from '@/constants/tokenList';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import {
  classifySolanaError,
  handleSolanaError,
} from '@/utils/solanaTransactionHelpers';
import { toBaseUnits } from '@/utils/to-base-units';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type Listing, type Rewards } from '@/features/listings/types';
import { getRpc } from '@/features/wallet/utils/getConnection';

const payoutsInFlight = new Set<string>();

interface Props {
  bounty: Listing | null;
  submission: SubmissionWithUser;
}

export const PayoutButton = ({ bounty, submission }: Props) => {
  const [isPaying, setIsPaying] = useState(false);
  const [warning, setWarning] = useState<{
    firstName: string;
    signature?: string;
  } | null>(null);

  const { user } = useUser();
  const { connected, publicKey, wallet } = useWallet();
  const queryClient = useQueryClient();

  const totalPrizeAmount =
    bounty?.rewards?.[submission?.winnerPosition as keyof Rewards] || 0;

  const totalPaidAmount =
    submission?.paymentDetails?.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    ) || 0;

  const remainingAmount = totalPrizeAmount - totalPaidAmount;

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

  const { mutateAsync: addPayment } = useMutation({
    mutationFn: ({ id, paymentDetails }: { id: string; paymentDetails: any }) =>
      api.post(`/api/sponsor-dashboard/submission/add-payment/`, {
        id,
        paymentDetails,
      }),
    onSuccess: (response, variables) => {
      const updatedSubmission = response.data;

      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', bounty?.slug],
        (old) =>
          old?.map((sub) =>
            sub.id === variables.id
              ? {
                  ...sub,
                  isPaid: updatedSubmission.isPaid,
                  paymentDetails: updatedSubmission.paymentDetails,
                }
              : sub,
          ),
      );
    },
    onError: (error) => {
      console.error('Payment record update failed', error);
    },
  });

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

    try {
      const senderAddress = address(publicKey.toBase58());
      const senderSigner: TransactionSigner = createNoopSigner(senderAddress);
      const tokenDetails = tokenList.find((e) => e.tokenSymbol === token);

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
        const mintAddress = tokenDetails?.mintAddress as string;
        const decimals = tokenDetails?.decimals as number;
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

      const standardWallet = (wallet.adapter as any)?.wallet as
        | {
            features: Record<string, unknown>;
            accounts: Array<{ address: string; publicKey: Uint8Array }>;
          }
        | undefined;

      if (!standardWallet) {
        throw new Error('Wallet not available');
      }

      const account =
        standardWallet.accounts.find(
          (item) => item.address === publicKey.toBase58(),
        ) ?? standardWallet.accounts[0];

      if (!account) {
        throw new Error('Wallet not available');
      }

      const signAndSend = standardWallet.features[
        'solana:signAndSendTransaction'
      ] as
        | SolanaSignAndSendTransactionFeature['solana:signAndSendTransaction']
        | undefined;

      if (!signAndSend) {
        throw new Error('Wallet does not support signAndSendTransaction');
      }

      const results = await signAndSend.signAndSendTransaction({
        account: account as any,
        transaction: txBytes as Uint8Array,
        chain: 'solana:mainnet',
        options: { skipPreflight: true },
      } as any);

      const result = Array.isArray(results) ? results[0] : results;
      txSignature = bs58.encode(result.signature);

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

      const nextTranche = (submission?.paymentDetails?.length || 0) + 1;
      const isProject = bounty?.type === 'project';

      await addPayment({
        id,
        paymentDetails: [
          {
            txId: txSignature,
            amount,
            tranche: isProject ? nextTranche : 1,
          },
        ],
      });
    } catch (error) {
      log.error(
        `Sponsor unable to pay, user id: ${user?.id}, sponsor id: ${user?.currentSponsorId}, error: ${error?.toString()}, sponsor wallet: ${publicKey?.toBase58()}`,
      );

      const firstName: string = (() => {
        const name =
          (submission as any)?.user?.name ||
          (submission as any)?.user?.firstName ||
          'the winner';
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

      if (errorType === 'user-rejected') {
      } else if (errorType === 'timeout' || errorType === 'rpc') {
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
          onClick={async () => {
            if (!submission?.user.walletAddress) {
              console.error('Public key is null, cannot proceed with payment');
              return;
            }
            posthog.capture('pay winner_sponsor');
            handlePayout({
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
