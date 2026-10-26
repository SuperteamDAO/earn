'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { useDisclosure } from '@/hooks/use-disclosure';
import { postJson } from '@/lib/fetch-json';
import { GrantTrancheStatus } from '@/prisma/enums';

import type { GrantTrancheWithApplication } from '../queries/tranches';
import { useGrantReview } from './GrantApplications/GrantReviewContext';
import { ApproveTrancheModal } from './Traches/ApproveTrancheModal';
import { RejectTrancheModal } from './Traches/RejectTrancheModal';
import { TrancheDetails } from './Traches/TrancheDetails';
import { TrancheList } from './Traches/TrancheList';

export const TranchesTab = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<
    Set<GrantTrancheStatus>
  >(new Set());

  const {
    grant,
    tranches: allTranches,
    setTranches,
    selectedTranche,
    setSelectedTranche,
  } = useGrantReview();
  const isTrancheLoading = false;

  const tranches = useMemo(() => {
    if (!allTranches) return [];

    let filtered = allTranches;

    if (searchText.trim()) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter((tranche) => {
        const user = tranche.GrantApplication.user;
        if (!user) return false;

        const nameParts = searchText.split(' ').filter(Boolean);
        const firstName = user.firstName?.toLowerCase() || '';
        const lastName = user.lastName?.toLowerCase() || '';

        return (
          firstName.includes(lowerSearchText) ||
          lastName.includes(lowerSearchText) ||
          user.email?.toLowerCase().includes(lowerSearchText) ||
          user.username?.toLowerCase().includes(lowerSearchText) ||
          user.twitter?.toLowerCase().includes(lowerSearchText) ||
          user.discord?.toLowerCase().includes(lowerSearchText) ||
          tranche.GrantApplication.projectTitle
            ?.toLowerCase()
            .includes(lowerSearchText) ||
          (nameParts.length > 1 &&
            firstName.includes(nameParts[0]?.toLowerCase() || '') &&
            lastName.includes(nameParts[1]?.toLowerCase() || ''))
        );
      });
    }

    if (selectedFilters.size > 0) {
      filtered = filtered.filter((tranche) => {
        return selectedFilters.has(tranche.status);
      });
    }

    return filtered;
  }, [allTranches, searchText, selectedFilters]);

  useEffect(() => {
    if (tranches && tranches.length > 0) {
      setSelectedTranche((selected) => {
        if (tranches.find((tranche) => tranche.id === selected?.id)) {
          return selected;
        }
        return tranches[0];
      });
    }
  }, [tranches, setSelectedTranche]);

  const {
    isOpen: approveIsOpen,
    onOpen: approveOnOpen,
    onClose: approveOnClose,
  } = useDisclosure();

  const {
    isOpen: rejectedIsOpen,
    onOpen: rejectedOnOpen,
    onClose: rejectedOnClose,
  } = useDisclosure();

  const moveToNextPendingTranche = () => {
    if (!selectedTranche) return;

    const currentIndex =
      tranches?.findIndex((tranche) => tranche.id === selectedTranche.id) || 0;
    if (currentIndex === -1) return;

    const nextPendingTranche = tranches
      ?.slice(currentIndex + 1)
      .find((tranche) => tranche.status === GrantTrancheStatus.Pending);

    if (nextPendingTranche) {
      setSelectedTranche(nextPendingTranche);
    }
  };

  // Shows the decision at once; puts the list back if the server refuses.
  const decideTranche = async (
    trancheId: string,
    update: Partial<GrantTrancheWithApplication>,
    body: Record<string, unknown>,
    failure: string,
  ) => {
    const previousTranches = allTranches;
    const updatedTranches = allTranches.map(
      (tranche: GrantTrancheWithApplication) =>
        tranche.id === trancheId ? { ...tranche, ...update } : tranche,
    );
    setTranches(updatedTranches);
    setSelectedTranche(
      updatedTranches.find(
        (tranche: GrantTrancheWithApplication) => tranche.id === trancheId,
      ),
    );
    moveToNextPendingTranche();
    try {
      await postJson('/api/sponsor-dashboard/grants/update-tranche-status/', {
        id: trancheId,
        ...body,
      });
    } catch {
      setTranches(previousTranches);
      toast.error(failure);
    }
  };

  const handleApproveTranche = (
    trancheId: string,
    approvedAmount: number,
    customNote?: string,
  ) => {
    const reviewerNote = customNote?.trim();
    void decideTranche(
      trancheId,
      { status: GrantTrancheStatus.Approved, approvedAmount },
      {
        status: 'Approved',
        approvedAmount,
        ...(reviewerNote ? { customNote: reviewerNote } : {}),
      },
      'Failed to approve grant. Please try again.',
    );
  };

  const handleRejectTranche = (trancheId: string, customNote?: string) => {
    const reviewerNote = customNote?.trim();
    void decideTranche(
      trancheId,
      { status: GrantTrancheStatus.Rejected },
      {
        status: 'Rejected',
        ...(reviewerNote ? { customNote: reviewerNote } : {}),
      },
      'Failed to reject grant. Please try again.',
    );
  };

  const enableCustomEmail = grant?.isNative === true || grant?.isST === true;

  return (
    <>
      <div className="flex w-full items-start bg-white">
        <div className="grid min-h-[42rem] w-full grid-cols-[23rem_1fr] bg-white">
          <div className="h-full w-full">
            <TrancheList
              tranches={tranches}
              setSearchText={setSearchText}
              selectedFilters={selectedFilters}
              onFilterChange={setSelectedFilters}
            />
          </div>

          <div className="h-full w-full rounded-r-lg border-t border-r border-b border-slate-200 bg-white">
            {!tranches?.length && !searchText && !isTrancheLoading ? (
              <>
                <ExternalImage
                  className="mx-auto mt-32 w-32"
                  alt={'talent empty'}
                  src={'/bg/talent-empty.svg'}
                />
                <p className="mx-auto mt-5 text-center text-lg font-semibold text-slate-600">
                  {'Zero Results'}
                </p>
                <p className="mx-auto mb-[200px] text-center font-medium text-slate-400">
                  {'Tranches will start appearing here'}
                </p>
              </>
            ) : (
              <TrancheDetails
                grant={grant}
                tranches={tranches}
                isLoading={isTrancheLoading}
                approveOnOpen={approveOnOpen}
                rejectedOnOpen={rejectedOnOpen}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-start gap-4">
        {!!searchText && (
          <p className="text-sm text-slate-400">
            Found <span className="font-bold">{tranches?.length || 0}</span>{' '}
            {tranches?.length === 1 ? 'result' : 'results'}
          </p>
        )}
      </div>

      <RejectTrancheModal
        trancheId={selectedTranche?.id}
        rejectIsOpen={rejectedIsOpen}
        rejectOnClose={rejectedOnClose}
        ask={selectedTranche?.ask}
        granteeName={selectedTranche?.GrantApplication?.user?.firstName}
        projectTitle={selectedTranche?.GrantApplication?.projectTitle}
        sponsorName={grant?.sponsor?.name}
        salutation={grant?.emailSalutation}
        token={grant?.token || 'USDC'}
        enableCustomEmail={enableCustomEmail}
        onRejectTranche={handleRejectTranche}
      />

      <ApproveTrancheModal
        trancheId={selectedTranche?.id}
        approveIsOpen={approveIsOpen}
        approveOnClose={approveOnClose}
        ask={selectedTranche?.ask}
        granteeName={selectedTranche?.GrantApplication?.user?.firstName}
        projectTitle={selectedTranche?.GrantApplication?.projectTitle}
        sponsorName={grant?.sponsor?.name}
        salutation={grant?.emailSalutation}
        token={grant?.token || 'USDC'}
        enableCustomEmail={enableCustomEmail}
        onApproveTranche={handleApproveTranche}
        grantApprovedAmount={
          selectedTranche?.GrantApplication?.approvedAmount || 0
        }
        grantTotalPaid={selectedTranche?.GrantApplication?.totalPaid || 0}
      />
    </>
  );
};
