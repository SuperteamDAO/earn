import { useQuery } from '@tanstack/react-query';
import { CircleHelp, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

import { cn } from '@/utils/cn';

import { useSyncTreasuryStatus } from '@/features/sponsor-dashboard/mutations/useSyncTreasuryStatus';
import { treasuryProposalStatusQuery } from '@/features/treasury/queries/treasuryProposalStatus';

interface TreasuryStatusProps {
  treasury:
    | {
        dao: string;
        proposalId: number;
      }
    | undefined;
  submissionIsPaid: boolean;
  submissionId: string;
  updateSubmission: () => void;
}

export default function TreasuryStatus({
  treasury,
  submissionIsPaid,
  submissionId,
  updateSubmission,
}: TreasuryStatusProps) {
  const { data: proposalStatus, isLoading: isLoadingProposalStatus } = useQuery(
    treasuryProposalStatusQuery(treasury?.dao, treasury?.proposalId ?? 0),
  );
  const { mutate: syncTreasuryStatus } = useSyncTreasuryStatus();

  useEffect(() => {
    if (proposalStatus === 'Approved' && !submissionIsPaid) {
      syncTreasuryStatus({ id: submissionId });
      updateSubmission();
    }
  }, [proposalStatus, submissionIsPaid, syncTreasuryStatus]);

  if (isLoadingProposalStatus || !proposalStatus || !treasury) {
    return <></>;
  }

  let className = '';
  let text = '';
  let image;
  switch (proposalStatus) {
    case 'InProgress':
      className = 'bg-yellow-100 text-amber-800';
      text = 'Pending Approval on NEAR Treasury';
      image = <CircleHelp className="mr-2 h-4 w-4" />;
      break;
    case 'Approved':
      className = 'bg-green-100 text-green-800';
      text = 'Approved';
      break;
    case 'Rejected':
      className = 'bg-red-100 text-red-500';
      text = 'Payment Has Been Rejected';
      image = <TriangleAlert className="mr-2 h-4 w-4" />;
      break;
    case 'Removed':
      className = 'bg-red-100 text-red-500';
      text = 'Payment Has Been Removed';
      image = <TriangleAlert className="mr-2 h-4 w-4" />;
      break;
    case 'Expired':
      className = 'bg-slate-100 text-slate-500';
      text = 'Payment Has Been Expired';
      break;
    case 'Failed':
      className = 'bg-red-100 text-red-500';
      text = 'Payment Has Failed';
      image = <TriangleAlert className="mr-2 h-4 w-4" />;
      break;
    default:
      className = 'bg-red-100 text-red-500';
      text = `Unknown Status: ${proposalStatus}`;
      image = <TriangleAlert className="mr-2 h-4 w-4" />;
      break;
  }

  return (
    <p className={cn('flex items-center rounded-md px-3 py-1', className)}>
      {image}
      {text}
    </p>
  );
}
