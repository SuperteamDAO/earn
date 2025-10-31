import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import bs58 from 'bs58';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { log } from 'next-axiom';
import posthog from 'posthog-js';
import React, { useState } from 'react';
import { toast } from 'sonner';

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
import { toBaseUnits } from '@/utils/to-base-units';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type Listing, type Rewards } from '@/features/listings/types';

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
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const { user } = useUser();

  const { connected, publicKey, sendTransaction, signTransaction } =
    useWallet();

  const { connection } = useConnection();
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

  const detectTokenProgram = async (mintAddress: string) => {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const accountInfo = await connection.getAccountInfo(mintPubkey);

      if (!accountInfo) {
        throw new Error('Token mint not found');
      }

      if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        return TOKEN_2022_PROGRAM_ID;
      }

      return TOKEN_PROGRAM_ID;
    } catch (error) {
      console.warn(
        'Failed to detect token program, defaulting to legacy:',
        error,
      );
      return TOKEN_PROGRAM_ID;
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
          old?.map((submission) =>
            submission.id === variables.id
              ? {
                  ...submission,
                  isPaid: updatedSubmission.isPaid,
                  paymentDetails: updatedSubmission.paymentDetails,
                }
              : submission,
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
    receiver: PublicKey;
  }) => {
    setIsPaying(true);
    try {
      const guardKey = `payout:${id}`;
      if (typeof window !== 'undefined') {
        const inFlight = window.localStorage.getItem(guardKey);
        if (inFlight) {
          toast.info('Payout is already in progress for this submission.');
          return;
        }
        window.localStorage.setItem(guardKey, 'in-progress');
      }

      const tokenDetails = tokenList.find((e) => e.tokenSymbol === token);
      const tokenAddress = tokenDetails?.mintAddress as string;

      const baseInstructions = [] as any[];

      if (token === 'SOL') {
        const lamportsBig = toBaseUnits(String(amount), 9);
        const lamportsNum = Number(lamportsBig);
        baseInstructions.push(
          SystemProgram.transfer({
            fromPubkey: publicKey as PublicKey,
            toPubkey: receiver,
            lamports: lamportsNum,
          }),
        );
      } else {
        const mint = new PublicKey(tokenAddress);
        const tokenProgramId = await detectTokenProgram(tokenAddress);

        let decimals = tokenDetails?.decimals as number;
        try {
          const mintInfo = await getMint(
            connection,
            mint,
            'confirmed',
            tokenProgramId,
          );
          decimals = mintInfo.decimals;
        } catch (e) {}

        const senderATA = getAssociatedTokenAddressSync(
          mint,
          publicKey as PublicKey,
          false,
          tokenProgramId,
        );
        const receiverATA = getAssociatedTokenAddressSync(
          mint,
          receiver as PublicKey,
          false,
          tokenProgramId,
        );

        try {
          const senderBal = await connection.getTokenAccountBalance(senderATA);
          const senderBalRaw = BigInt(senderBal.value.amount);
          const amountInBaseUnits = toBaseUnits(String(amount), decimals);
          if (senderBalRaw < amountInBaseUnits) {
            throw new Error('Insufficient token balance for payout');
          }
        } catch (e) {
          if ((e as Error).message.includes('Insufficient token balance')) {
            throw e;
          }
        }

        baseInstructions.push(
          createAssociatedTokenAccountIdempotentInstruction(
            publicKey as PublicKey,
            receiverATA,
            receiver,
            mint,
            tokenProgramId,
          ),
        );

        const amountInBaseUnits = toBaseUnits(String(amount), decimals);

        baseInstructions.push(
          createTransferCheckedInstruction(
            senderATA,
            mint,
            receiverATA,
            publicKey as PublicKey,
            amountInBaseUnits,
            decimals,
            [],
            tokenProgramId,
          ),
        );
      }

      const { blockhash: simBlockhash } = await connection.getLatestBlockhash();
      const testInstructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
        ...baseInstructions,
      ];

      const testMessage = new TransactionMessage({
        payerKey: publicKey as PublicKey,
        recentBlockhash: simBlockhash,
        instructions: testInstructions,
      }).compileToV0Message();
      const testTx = new VersionedTransaction(testMessage);

      const simulation = await connection.simulateTransaction(testTx);

      if (!simulation.value) {
        throw new Error('Simulation failed: no value returned');
      }

      if (simulation.value.err) {
        console.error('Simulation error logs:', simulation.value.logs);
        throw new Error(
          'Simulation failed; check token requirements or balance.',
        );
      }

      const unitsConsumed = simulation.value.unitsConsumed ?? 200_000;
      const computedCuLimit = Math.ceil((unitsConsumed as number) * 1.1);
      const setCuLimitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
        units: computedCuLimit,
      });

      let microLamports = 0;
      try {
        const feeMsg = new TransactionMessage({
          payerKey: publicKey as PublicKey,
          recentBlockhash: simBlockhash,
          instructions: baseInstructions,
        }).compileToV0Message();
        const feeTx = new VersionedTransaction(feeMsg);
        const serialized = feeTx.serialize();
        const rpcUrl = (connection as any).rpcEndpoint as string;
        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: '1',
            method: 'getPriorityFeeEstimate',
            params: [
              {
                transaction: bs58.encode(serialized),
                options: { recommended: true },
              },
            ],
          }),
        });
        const data = await res.json();
        const est = data?.result?.priorityFeeEstimate;
        if (typeof est === 'number' && est > 0) {
          microLamports = est;
        } else {
          microLamports = 5_000;
        }
      } catch (e) {
        microLamports = 5_000;
      }
      const setCuPriceInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports,
      });

      const { blockhash: latestBlockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const finalInstructions = [
        setCuLimitInstruction,
        setCuPriceInstruction,
        ...baseInstructions,
      ];

      const finalMessage = new TransactionMessage({
        payerKey: publicKey as PublicKey,
        recentBlockhash: latestBlockhash,
        instructions: finalInstructions,
      }).compileToV0Message();

      const finalTransaction = new VersionedTransaction(finalMessage);

      let signature = '';
      let rawBytes: Uint8Array | null = null;
      if (signTransaction) {
        const signed = await signTransaction(finalTransaction);
        const raw = signed.serialize();
        rawBytes = raw;
        signature = await connection.sendRawTransaction(raw, {
          skipPreflight: true,
          maxRetries: 0,
        });
      } else {
        signature = await sendTransaction(
          finalTransaction as unknown as any,
          connection,
          {
            skipPreflight: true,
            maxRetries: 0,
          } as any,
        );
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(guardKey, signature);
      }
      setLastSignature(signature);

      let confirmed = false;
      while (!confirmed) {
        const statuses = await connection.getSignatureStatuses([signature]);
        const status = statuses && statuses.value && statuses.value[0];
        if (
          status &&
          (status.confirmationStatus === 'confirmed' ||
            status.confirmationStatus === 'finalized')
        ) {
          confirmed = true;
          break;
        }

        const currentBlockHeight = await connection.getBlockHeight();
        if (currentBlockHeight > lastValidBlockHeight) {
          throw new Error('Blockhash expired before confirmation');
        }

        if (rawBytes) {
          try {
            await connection.sendRawTransaction(rawBytes, {
              skipPreflight: true,
              maxRetries: 0,
            });
          } catch {}
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const nextTranche = (submission?.paymentDetails?.length || 0) + 1;

      const isProject = bounty?.type === 'project';
      const trancheNumber = isProject ? nextTranche : 1;
      const paymentDetailsPayload = [
        {
          txId: signature,
          amount,
          tranche: trancheNumber,
        },
      ];

      await addPayment({
        id,
        paymentDetails: paymentDetailsPayload,
      });
      setIsPaying(false);
    } catch (error) {
      console.log(error);
      log.error(
        `Sponsor unable to pay, user id: ${user?.id}, sponsor id: ${user?.currentSponsorId}, error: ${error?.toString()}, sponsor wallet: ${publicKey?.toBase58()}`,
      );

      const firstName = (() => {
        const name =
          (submission as any)?.user?.name ||
          (submission as any)?.user?.firstName ||
          'the winner';
        return typeof name === 'string' && name.trim().length > 0
          ? name.trim().split(' ')[0]
          : 'the winner';
      })();

      const classifyError = (
        e: unknown,
      ):
        | 'user-rejected'
        | 'expired'
        | 'timeout'
        | 'rpc'
        | 'insufficient-funds'
        | 'token-not-available'
        | 'unknown' => {
        const text = String((e as any)?.message ?? e ?? '').toLowerCase();
        if (
          text.includes('user rejected') ||
          text.includes('rejected the request') ||
          text.includes('denied') ||
          text.includes('declined')
        ) {
          return 'user-rejected';
        }
        if (
          text.includes('expired') ||
          text.includes('blockhash') ||
          text.includes('lastvalidblockheight')
        ) {
          return 'expired';
        }
        if (
          text.includes('timed out') ||
          text.includes('timeout') ||
          text.includes('was not confirmed')
        ) {
          return 'timeout';
        }
        if (
          text.includes('failed to fetch') ||
          text.includes('429') ||
          text.includes('503') ||
          text.includes('network') ||
          text.includes('econnreset') ||
          text.includes('enotfound')
        ) {
          return 'rpc';
        }
        if (
          text.includes('insufficient') ||
          text.includes('insufficient token balance') ||
          text.includes('insufficient funds')
        ) {
          return 'insufficient-funds';
        }
        if (text.includes('check token requirements')) {
          return 'token-not-available';
        }
        return 'unknown';
      };

      const reason = classifyError(error);
      switch (reason) {
        case 'user-rejected':
          toast.error('Payment cancelled in wallet.');
          setIsPaying(false);
          break;
        case 'expired':
          toast.error('Blockhash expired. Payment not sent.');
          setIsPaying(false);
          break;
        case 'insufficient-funds':
          toast.error(
            `Insufficient ${bounty?.token} balance. Please add funds to your wallet and try again.`,
          );
          setIsPaying(false);
          break;
        case 'token-not-available':
          toast.error(
            `${bounty?.token} not available in wallet. Please add ${bounty?.token} to your wallet and try again.`,
          );
          setIsPaying(false);
          break;
        case 'timeout': {
          if (typeof lastSignature === 'string' && lastSignature.length > 0) {
            toast.info(
              'Network congestion: transaction may still confirm. Check explorer.',
            );
          } else {
            setWarning({ firstName: firstName as string, signature: '' });
          }
          setIsPaying(false);
          break;
        }
        case 'rpc':
        case 'unknown':
        default:
          setWarning({
            firstName: firstName as string,
            signature: (lastSignature as string) ?? '',
          });
          setIsPaying(false);
          break;
      }
    } finally {
      try {
        if (typeof window !== 'undefined') {
          Object.keys(window.localStorage)
            .filter((k) => k.startsWith('payout:'))
            .forEach((k) => window.localStorage.removeItem(k));
        }
      } catch {}
    }
  };

  return (
    <>
      <div
        className="ph-no-capture"
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
              id: submission?.id as string,
              token: bounty?.token as string,
              amount: remainingAmount,
              receiver: new PublicKey(submission.user.walletAddress),
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
