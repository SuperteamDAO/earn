import { TooltipArrow } from '@radix-ui/react-tooltip';
import { ExternalLink } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';
import { tokenList } from '@/constants/tokenList';
import { type SubmissionWithUser } from '@/interface/submission';
import { getRankLabels } from '@/utils/rank';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type Listing, type Rewards } from '@/features/listings/types';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { PayoutButton } from './PayoutButton';

export const PayoutSection = ({
  submissions,
  bounty,
}: {
  submissions: SubmissionWithUser[];
  bounty: Listing;
}) => {
  const winners = submissions.filter(
    (submission) => submission.isWinner && submission.winnerPosition,
  );

  if (winners.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        No winners have been announced yet.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-x-auto rounded-md border border-gray-200">
      <Table className="overflow-hidden">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[40%]">Winner Name</TableHead>
            <TableHead className="w-[20%]">Position</TableHead>
            <TableHead className="w-[20%]">Prize</TableHead>
            <TableHead className="w-[20%]">Payment Transactions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {winners.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {submission.user.photo && (
                    <EarnAvatar
                      id={submission.user.id}
                      avatar={submission.user.photo}
                    />
                  )}
                  <div>
                    <div>
                      {submission.user.firstName} {submission.user.lastName}
                    </div>
                    <div className="text-sm text-slate-500">
                      @{submission.user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium text-slate-800 capitalize">
                  {getRankLabels(submission.winnerPosition!)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <img
                    src={
                      tokenList.find((ele) => ele.tokenSymbol === bounty.token)
                        ?.icon
                    }
                    alt={bounty.token}
                    className="h-4 w-4"
                  />
                  <span className="font-medium text-slate-900">
                    {!!bounty.rewards &&
                      bounty.rewards[
                        submission.winnerPosition as keyof Rewards
                      ]}{' '}
                    <span className="text-slate-400">{bounty.token}</span>
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {submission.isPaid ? (
                  <div
                    className="flex cursor-pointer items-center text-sm font-medium text-slate-600 hover:text-slate-900"
                    onClick={() => {
                      window.open(
                        `https://solscan.io/tx/${submission.paymentDetails?.txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`,
                        '_blank',
                      );
                    }}
                  >
                    {truncatePublicKey(submission.paymentDetails?.txId, 5)}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </div>
                ) : bounty.isWinnersAnnounced ? (
                  <PayoutButton bounty={bounty} />
                ) : (
                  <Tooltip
                    content={
                      <>
                        Please announce the winners before paying out the
                        winners
                        <TooltipArrow />
                      </>
                    }
                    contentProps={{ sideOffset: 5 }}
                  >
                    <Button disabled size="sm" variant="default">
                      Pay {bounty.token}{' '}
                      {!!bounty.rewards &&
                        bounty.rewards[
                          submission.winnerPosition as keyof Rewards
                        ]}
                    </Button>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
