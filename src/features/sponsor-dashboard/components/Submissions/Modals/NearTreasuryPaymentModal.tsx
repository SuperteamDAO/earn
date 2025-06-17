import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  RefreshCcw,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { HELP_URL } from '@/constants/project';
import { useClipboard } from '@/hooks/use-clipboard';
import { useUser } from '@/store/user';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { useCreateTreasuryProposal } from '@/features/sponsor-dashboard/mutations/useCreateTreasuryProposal';
import {
  isNearnIoRequestorQuery,
  isValidDaoPolicyQuery,
} from '@/features/sponsor-dashboard/queries/isNearnIoRequestor';
import { sponsorQuery } from '@/features/sponsor-dashboard/queries/sponsor';

interface NearTreasuryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  onSuccess: (treasuryLink: string, proposalId: number, dao: string) => void;
}

type ModalState = 'not_requestor' | 'loading' | 'success' | 'error';

export default function NearTreasuryPaymentModal({
  isOpen,
  onClose,
  submissionId,
  onSuccess,
}: NearTreasuryPaymentModalProps) {
  const { user } = useUser();
  const { data: sponsorData } = useQuery(sponsorQuery(user?.currentSponsorId));
  const { data: isRequestor } = useQuery(
    isNearnIoRequestorQuery(sponsorData?.nearTreasury?.dao),
  );
  const { data: isValidDaoPolicy } = useQuery(
    isValidDaoPolicyQuery(sponsorData?.nearTreasury?.dao),
  );
  const [modalState, setModalState] = useState<ModalState>('not_requestor');
  const [treasuryLink, setTreasuryLink] = useState<string>('');

  const { onCopy: onCopyTreasuryLink, hasCopied: hasCopiedTreasuryLink } =
    useClipboard(getURLSanitized(treasuryLink));

  const createTreasuryProposal = useCreateTreasuryProposal();

  const handleCreateProposal = async () => {
    try {
      setModalState('loading');
      const response = await createTreasuryProposal.mutateAsync({
        id: submissionId,
      });

      setTreasuryLink(response.url);
      onSuccess(
        response.url,
        response.proposalId,
        sponsorData?.nearTreasury?.dao || '',
      );
      setModalState('success');
    } catch (error) {
      setModalState('error');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (!isRequestor || !isValidDaoPolicy) {
      setModalState('not_requestor');
    } else {
      handleCreateProposal();
    }
  }, [sponsorData, isRequestor, isValidDaoPolicy, isOpen]);

  const renderContent = () => {
    switch (modalState) {
      case 'not_requestor':
        return (
          <DialogContent hideCloseIcon>
            <DialogHeader>
              <DialogTitle>Connect your NEAR Treasury account</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              It looks like you haven&apos;t linked your NEAR Treasury account
              yet. Please visit your Sponsor Profile settings to set it up first
            </DialogDescription>
            <DialogFooter>
              <Button
                variant="link"
                onClick={onClose}
                className="text-slate-500"
              >
                Cancel
              </Button>
              <Link href={`/sponsor/edit`}>
                <Button variant="default">
                  Sponsor Profile{' '}
                  <ChevronRight className="h-4 w-4" strokeWidth={3} />
                </Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        );

      case 'loading':
        return (
          <DialogContent hideCloseIcon>
            <div className="flex h-full flex-col">
              <div className="flex flex-col py-14">
                <div className="mb-4 flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-green" />
                </div>
                <div className="mx-auto mt-8 flex w-full flex-col items-center gap-2">
                  <DialogTitle>
                    Submitting your proposal to NEAR Treasury...
                  </DialogTitle>
                  <DialogDescription className="text-center text-sm text-slate-500">
                    This may take a few minutes. Please don&apos;t close the
                    window
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogContent>
        );

      case 'success':
        return (
          <DialogContent className="p-0" hideCloseIcon>
            <div className="flex h-40 items-center justify-center bg-emerald-50">
              <div className="rounded-full bg-emerald-600 p-3">
                <Check className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
            </div>
            <div className="p-6">
              <DialogTitle className="font-bold">
                Payment Request Created
              </DialogTitle>
              <DialogDescription className="mt-2">
                Your proposal has been successfully submitted to NEAR Treasury
                for approval
              </DialogDescription>
              <div className="mt-4 flex w-full flex-col items-center gap-4">
                <div className="relative w-full border-slate-100">
                  <Input
                    className="w-full overflow-hidden text-ellipsis whitespace-nowrap border-slate-100 pr-10 text-slate-500 focus-visible:ring-[#CFD2D7] focus-visible:ring-offset-0"
                    readOnly
                    value={getURLSanitized(treasuryLink)}
                  />

                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {hasCopiedTreasuryLink ? (
                      <Check className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Copy
                        className="h-5 w-5 cursor-pointer text-slate-400"
                        onClick={onCopyTreasuryLink}
                      />
                    )}
                  </div>
                </div>
                <Link
                  href={getURLSanitized(treasuryLink)}
                  target="_blank"
                  className="w-full"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full">
                    View on NEAR Treasury
                    <ExternalLink className="ml-2 h-4 w-4" strokeWidth={3} />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="flex w-full items-center justify-center gap-0 text-slate-500"
                  onClick={onClose}
                >
                  Submission List <ChevronRight className="ml-3 h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        );

      case 'error':
        return (
          <DialogContent className="pt-0" hideCloseIcon>
            <div className="flex items-center justify-center py-10">
              <div className="flex items-center justify-center rounded-full bg-yellow-100 p-3">
                <div className="rounded-full bg-yellow-600 p-3">
                  <X className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
              </div>
            </div>
            <div className="mx-auto mt-6 flex max-w-[20rem] flex-col items-center gap-2">
              <DialogTitle>Something went wrong ...</DialogTitle>
              <p className="text-center text-sm text-slate-500">
                Please try again or{' '}
                <Link
                  href={HELP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  get support
                </Link>
              </p>
            </div>
            <div className="mx-auto mt-8 flex flex-col items-center gap-6 font-bold">
              <Button onClick={() => handleCreateProposal()}>
                <RefreshCcw className="mr-1 h-4 w-4" strokeWidth={3} /> Try
                Again
              </Button>
            </div>
          </DialogContent>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="max-w-[30rem]">{renderContent()}</div>
    </Dialog>
  );
}
