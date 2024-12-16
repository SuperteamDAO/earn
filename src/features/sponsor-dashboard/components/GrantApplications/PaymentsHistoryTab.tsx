import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronUp, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';

import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { tokenList } from '@/constants/tokenList';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type Grant } from '@/features/grants/types';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { approvedGranteesQuery } from '../../queries/approved-grantees';
import { type GrantApplicationWithUser } from '../../types';
import { RecordPaymentButton } from './RecordPaymentButton';

interface GrantPaymentDetailProps {
  tranche: number;
  amount: number;
  txId?: string;
}

const extractTxId = (url: string) => {
  const match = url.match(/tx\/([a-zA-Z0-9]+)/);
  return match ? match[1] : url;
};

const PaymentDetailsRow = ({
  paymentDetails,
  token,
}: {
  paymentDetails: GrantPaymentDetailProps[];
  token: string;
}) => {
  return (
    <>
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
      <TableCell>
        {paymentDetails.map((payment, index) => (
          <div className="my-2 flex items-center justify-between" key={index}>
            <p className="text-sm font-medium text-slate-500">
              Milestone {payment.tranche}
            </p>
          </div>
        ))}
      </TableCell>
      {paymentDetails.some((payment) => payment.txId) && (
        <TableCell colSpan={2}>
          {paymentDetails.map(
            (payment, index) =>
              payment.txId && (
                <div key={index} className="my-2">
                  <a
                    className="flex items-center gap-1"
                    href={payment.txId}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <p className="text-sm font-medium text-slate-500">
                      {truncatePublicKey(extractTxId(payment.txId), 6)}
                    </p>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </a>
                </div>
              ),
          )}
        </TableCell>
      )}
    </>
  );
};

export const PaymentsHistoryTab = ({
  grantId,
  grant,
}: {
  grantId: string | undefined;
  grant: Grant | undefined;
}) => {
  const { user } = useUser();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const isNativeAndNonST = !grant?.airtableId && grant?.isNative;

  const { data: grantees } = useQuery(
    approvedGranteesQuery(grantId, user?.currentSponsorId),
  );

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

  const GrantTh = ({ children }: { children?: string }) => {
    return (
      <TableHead className="text-xs font-medium uppercase tracking-tight text-slate-500">
        {children}
      </TableHead>
    );
  };

  const handlePaymentRecorded = (
    updatedApplication: GrantApplicationWithUser,
  ) => {
    queryClient.setQueryData<GrantApplicationWithUser[]>(
      ['grantees', grantId],
      (oldData) =>
        oldData?.map((grantee) =>
          grantee.id === updatedApplication.id ? updatedApplication : grantee,
        ),
    );
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="text-slate-100">
              <GrantTh>Approved Grantee</GrantTh>
              <GrantTh>Approved</GrantTh>
              <GrantTh>Paid Out</GrantTh>
              <GrantTh>% Paid</GrantTh>
              <GrantTh />
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {grantees?.map((grantee: GrantApplicationWithUser) => {
              const paidPercentage = Number(
                ((grantee.totalPaid / grantee.approvedAmount) * 100).toFixed(2),
              );

              const isExpanded = expandedRows.has(grantee.id);
              return (
                <React.Fragment key={grantee.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EarnAvatar
                          id={grantee.userId}
                          avatar={grantee.user.photo!}
                          size="36px"
                        />
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-slate-700">
                            {grantee.user.firstName} {grantee.user.lastName}
                          </p>
                          <p className="text-sm font-medium text-slate-500">
                            @{grantee.user.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <img
                          className="h-4 w-4 rounded-full"
                          src={
                            tokenList.find(
                              (t) => t.tokenSymbol === grant?.token,
                            )?.icon || ''
                          }
                          alt={grant?.token}
                        />
                        <p className="text-sm font-medium text-slate-700">
                          {grantee.approvedAmount}{' '}
                          <span className="text-slate-400">{grant?.token}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <img
                          className="h-4 w-4 rounded-full"
                          alt={grant?.token}
                          src={
                            tokenList.find(
                              (t) => t.tokenSymbol === grant?.token,
                            )?.icon || ''
                          }
                        />
                        <p className="text-sm font-medium text-slate-700">
                          {grantee.totalPaid}{' '}
                          <span className="text-slate-400">{grant?.token}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress
                          className="h-1.5 w-20 rounded-full"
                          value={paidPercentage}
                        />
                        <p className="text-sm font-medium text-slate-500">
                          {paidPercentage}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="p-0 text-right">
                      <div className="flex items-center gap-2">
                        {isNativeAndNonST && (
                          <RecordPaymentButton
                            applicationId={grantee.id}
                            className="h-8"
                            approvedAmount={grantee.approvedAmount}
                            totalPaid={grantee.totalPaid}
                            token={grant?.token || 'USDC '}
                            onPaymentRecorded={handlePaymentRecorded}
                          />
                        )}
                        <span
                          className={cn(
                            'cursor-pointer text-slate-500 transition-transform duration-300',
                            isExpanded ? 'rotate-0' : 'rotate-180',
                          )}
                          onClick={() => toggleExpandRow(grantee.id)}
                        >
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && grantee.paymentDetails && (
                    <TableRow>
                      <TableCell />
                      <PaymentDetailsRow
                        paymentDetails={
                          grantee.paymentDetails as unknown as GrantPaymentDetailProps[]
                        }
                        token={grant?.token || 'USDC'}
                      />
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
