import { TooltipArrow } from '@radix-ui/react-tooltip';
import { ChevronDown, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { cn } from '@/utils/cn';
import { getRankLabels } from '@/utils/rank';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type Listing, type Rewards } from '@/features/listings/types';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { PayoutButton } from './PayoutButton';

const PaymentDetailsRow = ({
  paymentDetails,
  token,
}: {
  paymentDetails: Array<{
    txId: string;
    amount: number;
    tranche: number;
  }>;
  token: string;
}) => {
  return (
    <>
      <TableCell>
        {paymentDetails.map((payment, index) => (
          <div className="my-2 flex items-center justify-between" key={index}>
            <p className="text-sm font-medium text-slate-500">
              Tranche {payment.tranche}
            </p>
          </div>
        ))}
      </TableCell>
      <TableCell>
        {paymentDetails.map((payment, index) => (
          <div className="my-2 flex items-center justify-between" key={index}>
            <div className="flex items-center gap-1">
              <img
                className="h-4 w-4 rounded-full"
                src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
                alt={`${token}`}
              />
              <p className="text-sm font-medium text-slate-700">
                {payment.amount} <span className="text-slate-400">{token}</span>
              </p>
            </div>
          </div>
        ))}
      </TableCell>
      <TableCell colSpan={2}>
        {paymentDetails.map(
          (payment, index) =>
            payment.txId && (
              <div key={index} className="my-2">
                <div
                  className="flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => {
                    window.open(
                      `https://solscan.io/tx/${payment.txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`,
                      '_blank',
                    );
                  }}
                >
                  <p className="text-sm font-medium text-slate-500">
                    {truncatePublicKey(payment.txId, 5)}
                  </p>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ),
        )}
      </TableCell>
    </>
  );
};

export const PayoutSection = ({
  submissions,
  bounty,
}: {
  submissions: SubmissionWithUser[];
  bounty: Listing;
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpandRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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

  const isProject = bounty.type === 'project';

  return (
    <div className="h-full w-full overflow-x-auto rounded-md border border-gray-200">
      <Table className="overflow-hidden">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[40%]">Winner Name</TableHead>
            <TableHead className="w-[10%]">Position</TableHead>
            <TableHead className="w-[15%]">Prize</TableHead>
            {isProject && <TableHead className="w-[15%]">% Paid</TableHead>}
            <TableHead className="w-[15%] whitespace-nowrap">
              Payment Details
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {winners.map((submission) => {
            const hasMultipleTranches =
              !submission?.isPaid &&
              submission.paymentDetails &&
              submission.paymentDetails.length > 0;

            const isExpanded = expandedRows.has(submission.id);

            const totalPaid = submission.paymentDetails?.reduce(
              (acc, payment) => acc + payment.amount,
              0,
            );

            const paidPercentage = (
              ((totalPaid ?? 0) / (bounty.rewardAmount ?? 0)) *
              100
            ).toFixed(2);

            return (
              <React.Fragment key={submission.id}>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <EarnAvatar
                        id={submission.user.id}
                        avatar={submission.user.photo}
                        className="size-8"
                      />
                      <div>
                        <div>
                          {submission.user.firstName} {submission.user.lastName}
                        </div>
                        <div className="text-xs text-slate-500">
                          @{submission.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-800 capitalize">
                      {isProject
                        ? 'Winner'
                        : getRankLabels(submission.winnerPosition!)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          tokenList.find(
                            (ele) => ele.tokenSymbol === bounty.token,
                          )?.icon
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
                  {isProject && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress
                          className="h-1.5 w-16 rounded-full"
                          value={Number(paidPercentage)}
                        />
                        <p className="text-sm font-medium text-slate-500">
                          {paidPercentage}%
                        </p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {submission.isPaid ? (
                        isProject && hasMultipleTranches ? (
                          <div
                            className="flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                            onClick={() => toggleExpandRow(submission.id)}
                          >
                            <span>View transaction links</span>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-slate-400 transition-transform duration-300 ease-in-out',
                                isExpanded ? 'rotate-180' : 'rotate-0',
                              )}
                            />
                          </div>
                        ) : (
                          <div
                            className="flex cursor-pointer items-center text-sm font-medium text-slate-600 hover:text-slate-900"
                            onClick={() => {
                              const txId = submission.paymentDetails?.[0]?.txId;
                              if (txId) {
                                window.open(
                                  `https://solscan.io/tx/${txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`,
                                  '_blank',
                                );
                              }
                            }}
                          >
                            {submission.paymentDetails?.[0]?.txId &&
                              truncatePublicKey(
                                submission.paymentDetails[0].txId,
                                5,
                              )}
                            <ExternalLink className="ml-1 h-4 w-4" />
                          </div>
                        )
                      ) : bounty.isWinnersAnnounced ? (
                        <div className="flex items-center gap-8">
                          <PayoutButton bounty={bounty} />
                          {hasMultipleTranches && (
                            <span
                              onClick={() => toggleExpandRow(submission.id)}
                            >
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 text-slate-400 transition-transform duration-300 ease-in-out',
                                  isExpanded ? 'rotate-180' : 'rotate-0',
                                )}
                              />
                            </span>
                          )}
                        </div>
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
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && isProject && hasMultipleTranches && (
                  <TableRow>
                    <TableCell />
                    <PaymentDetailsRow
                      paymentDetails={submission.paymentDetails!}
                      token={bounty.token || 'USDC'}
                    />
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
