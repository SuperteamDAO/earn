import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAtom } from 'jotai';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { log } from 'next-axiom';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { tokenList } from '@/constants/tokenList';
import { type Listing, type Rewards } from '@/features/listings';
import { type SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { selectedSubmissionAtom } from '../..';

interface Props {
  bounty: Listing | null;
}

export const PayoutButton = ({ bounty }: Props) => {
  const [isPaying, setIsPaying] = useState(false);

  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  const { connected, publicKey, sendTransaction } = useWallet();
  const posthog = usePostHog();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  const DynamicWalletMultiButton = dynamic(
    async () =>
      (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false },
  );

  const { mutate: addPayment } = useMutation({
    mutationFn: ({
      id,
      isPaid,
      paymentDetails,
    }: {
      id: string;
      isPaid: boolean;
      paymentDetails: any;
    }) =>
      axios.post(`/api/sponsor-dashboard/submission/add-payment/`, {
        id,
        isPaid,
        paymentDetails,
      }),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', bounty?.slug],
        (old) =>
          old?.map((submission) =>
            submission.id === variables.id
              ? {
                  ...submission,
                  isPaid: variables.isPaid,
                  paymentDetails: variables.paymentDetails,
                }
              : submission,
          ),
      );

      setSelectedSubmission((prev) =>
        prev && prev.id === variables.id
          ? {
              ...prev,
              isPaid: variables.isPaid,
              paymentDetails: variables.paymentDetails,
            }
          : prev,
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

      const latestBlockHash = await connection.getLatestBlockhash();

      const senderATA = await getAssociatedTokenAddressSync(
        new PublicKey(tokenAddress),
        publicKey as PublicKey,
      );
      const receiverATA = await getAssociatedTokenAddressSync(
        new PublicKey(tokenAddress),
        receiver as PublicKey,
      );

      if (token === 'SOL') {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey as PublicKey,
            toPubkey: receiver,
            lamports: LAMPORTS_PER_SOL * amount,
          }),
        );
      } else {
        const receiverATAExists = await connection.getAccountInfo(receiverATA);

        if (!receiverATAExists) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey as PublicKey,
              receiverATA,
              receiver,
              new PublicKey(tokenAddress),
            ),
          );
        }

        transaction.add(
          createTransferInstruction(
            senderATA,
            receiverATA,
            publicKey as PublicKey,
            amount * 10 ** power,
          ),
        );
      }

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction(
        {
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature,
        },
        'finalized',
      );

      await addPayment({
        id,
        isPaid: true,
        paymentDetails: {
          txId: signature,
        },
      });
    } catch (error) {
      console.log(error);
      log.error('Sponsor unable to pay');
    } finally {
      setIsPaying(false);
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
        <DynamicWalletMultiButton
          style={{
            height: '40px',
            fontWeight: 600,
            fontFamily: 'Inter',
            paddingRight: '16px',
            paddingLeft: '16px',
            fontSize: '12px',
          }}
        >
          {connected
            ? truncatePublicKey(publicKey?.toBase58(), 3)
            : `Pay ${
                formatNumberWithSuffix(
                  bounty?.rewards?.[
                    selectedSubmission?.winnerPosition as keyof Rewards
                  ]!,
                  2,
                  true,
                ) || '0'
              } ${bounty?.token}`}
        </DynamicWalletMultiButton>
      </div>
      {connected && (
        <Button
          className={cn(
            'ph-no-capture mr-4 min-w-[120px]',
            'disabled:cursor-not-allowed',
          )}
          disabled={!bounty?.isWinnersAnnounced}
          onClick={async () => {
            if (!selectedSubmission?.user.publicKey) {
              console.error('Public key is null, cannot proceed with payment');
              return;
            }
            posthog.capture('pay winner_sponsor');
            handlePayout({
              id: selectedSubmission?.id as string,
              token: bounty?.token as string,
              amount: bounty?.rewards![
                selectedSubmission?.winnerPosition as keyof Rewards
              ] as number,
              receiver: new PublicKey(selectedSubmission.user.publicKey),
            });
          }}
          variant="default"
        >
          {isPaying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Paying...
            </>
          ) : (
            `Pay ${
              formatNumberWithSuffix(
                bounty?.rewards?.[
                  selectedSubmission?.winnerPosition as keyof Rewards
                ]!,
                2,
                true,
              ) || '0'
            } ${bounty?.token}`
          )}
        </Button>
      )}
    </>
  );
};
