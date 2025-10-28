import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { log } from 'next-axiom';
import posthog from 'posthog-js';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { tokenList } from '@/constants/tokenList';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { type Listing, type Rewards } from '@/features/listings/types';

interface Props {
  bounty: Listing | null;
  submission: SubmissionWithUser;
}

export const PayoutButton = ({ bounty, submission }: Props) => {
  const [isPaying, setIsPaying] = useState(false);

  const { user } = useUser();

  const { connected, publicKey, sendTransaction } = useWallet();

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

  const { mutate: addPayment } = useMutation({
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
      const transaction = new Transaction();
      const tokenDetails = tokenList.find((e) => e.tokenSymbol === token);
      const tokenAddress = tokenDetails?.mintAddress as string;
      const power = tokenDetails?.decimals as number;

      if (token === 'SOL') {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey as PublicKey,
            toPubkey: receiver,
            lamports: LAMPORTS_PER_SOL * amount,
          }),
        );
      } else {
        const tokenProgramId = await detectTokenProgram(tokenAddress);

        const senderATA = getAssociatedTokenAddressSync(
          new PublicKey(tokenAddress),
          publicKey as PublicKey,
          false,
          tokenProgramId,
        );
        const receiverATA = getAssociatedTokenAddressSync(
          new PublicKey(tokenAddress),
          receiver as PublicKey,
          false,
          tokenProgramId,
        );

        const receiverATAExists = await connection.getAccountInfo(receiverATA);

        if (!receiverATAExists) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey as PublicKey,
              receiverATA,
              receiver,
              new PublicKey(tokenAddress),
              tokenProgramId,
            ),
          );
        }

        transaction.add(
          createTransferInstruction(
            senderATA,
            receiverATA,
            publicKey as PublicKey,
            amount * 10 ** power,
            [],
            tokenProgramId,
          ),
        );
      }

      const compute = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 }),
      ];

      transaction.add(...compute);

      const signature = await sendTransaction(transaction, connection);

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

      await pollForSignature(signature);

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
    } catch (error) {
      console.log(error);
      log.error(
        `Sponsor unable to pay, user id: ${user?.id}, sponsor id: ${user?.currentSponsorId}, error: ${error?.toString()}, sponsor wallet: ${publicKey?.toBase58()}`,
      );
      toast.error(
        'Alert: Payment might have gone through. Please check your wallet history to confirm.',
      );
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Button
      className="ph-no-capture min-w-[160px] text-center disabled:cursor-not-allowed"
      disabled={
        !connected ||
        !bounty?.isWinnersAnnounced ||
        remainingAmount <= 0 ||
        !submission?.user.walletAddress
      }
      onClick={async () => {
        if (!connected) {
          toast.error('Please connect your wallet first');
          return;
        }
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
      ) : !connected ? (
        'Connect wallet to pay'
      ) : (
        `Pay ${
          formatNumberWithSuffix(remainingAmount, 2, true) || '0'
        } ${bounty?.token}`
      )}
    </Button>
  );
};
