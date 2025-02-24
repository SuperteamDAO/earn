import { GrantApplicationStatus } from '@prisma/client';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { useDisclosure } from '@/hooks/use-disclosure';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { selectedGrantTrancheAtom } from '../atoms';
import { sponsorGrantQuery } from '../queries/grant';
import { tranchesQuery, type TranchesReturn } from '../queries/tranches';
import { ApproveTrancheModal } from './Traches/ApproveTrancheModal';
import { RejectTrancheModal } from './Traches/RejectTrancheModal';
import { TrancheDetails } from './Traches/TrancheDetails';
import { TrancheList } from './Traches/TrancheList';

interface Props {
  slug: string;
}

export const TranchesTab = ({ slug }: Props) => {
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);

  const params = { searchText, length: 20, skip: 0 };

  const { data: trancheReturn, isLoading: isTrancheLoading } = useQuery({
    ...tranchesQuery(slug, params),
    retry: false,
    placeholderData: keepPreviousData,
  });

  const tranches = useMemo(() => trancheReturn?.data, [trancheReturn]);

  const totalCount = useMemo(() => trancheReturn?.count || 0, [trancheReturn]);

  let length = 20;
  const [pageSelections, setPageSelections] = useState<Record<number, string>>(
    {},
  );

  const { user } = useUser();

  const { data: grant } = useQuery(
    sponsorGrantQuery(slug, user?.currentSponsorId),
  );

  const queryClient = useQueryClient();

  const [selectedTranche, setSelectedTranche] = useAtom(
    selectedGrantTrancheAtom,
  );

  useEffect(() => {
    if (searchText) {
      length = 999;
      if (skip !== 0) {
        setSkip(0);
      }
    } else {
      length = 20;
    }
  }, [searchText]);

  useEffect(() => {
    if (tranches && tranches.length > 0) {
      setSelectedTranche((selectedTranche) => {
        if (tranches.find((tranche) => tranche.id === selectedTranche?.id)) {
          return selectedTranche;
        }
        return tranches[0];
      });
    }
  }, [tranches, searchText]);

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

  const isAnyModalOpen = rejectedIsOpen || approveIsOpen;

  const changePage = useCallback(
    async (newSkip: number, selectIndex: number) => {
      if (newSkip < 0 || newSkip >= grant?.grantTrancheCount!) return;
      setSkip(newSkip);
      await new Promise((resolve) => setTimeout(resolve, 0));

      await queryClient.prefetchQuery({
        ...tranchesQuery(slug, { ...params, skip: newSkip }),
        staleTime: Infinity,
      });

      const newTranches = queryClient.getQueryData<TranchesReturn>([
        'sponsor-tranches',
        slug,
        { ...params, skip: newSkip },
      ]);

      if (newTranches && newTranches.count > 0) {
        if (selectIndex === -1) {
          const savedSelectionId = pageSelections[newSkip];
          const savedTranche = savedSelectionId
            ? newTranches.data.find(
                (tranche) => tranche.id === savedSelectionId,
              )
            : null;

          if (savedTranche) {
            setSelectedTranche(savedTranche);
          } else {
            setSelectedTranche(newTranches.data[0]);
          }
        } else {
          setSelectedTranche(
            newTranches.data[
              Math.min(selectIndex, newTranches.data.length - 1)
            ],
          );
        }
      }
    },
    [
      queryClient,
      slug,
      params,
      grant?.grantTrancheCount,
      setSelectedTranche,
      pageSelections,
    ],
  );

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!tranches?.length) return;

      if (!isAnyModalOpen) {
        const currentIndex = tranches.findIndex(
          (tranche) => tranche.id === selectedTranche?.id,
        );

        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            if (currentIndex > 0) {
              setSelectedTranche(tranches[currentIndex - 1]);
            } else if (skip > 0) {
              // When going to the previous page, select the last item
              await changePage(Math.max(skip - length, 0), length - 1);
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (currentIndex < tranches.length - 1) {
              setSelectedTranche(tranches[currentIndex + 1]);
            } else if (skip + length < totalCount!) {
              await changePage(skip + length, 0);
            }
            break;
          case 'ArrowLeft':
            e.preventDefault();
            if (skip > 0) {
              await changePage(Math.max(skip - length, 0), -1);
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (skip + length < totalCount!) {
              await changePage(skip + length, -1);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    tranches,
    selectedTranche,
    skip,
    length,
    grant?.grantTrancheCount,
    changePage,
    isAnyModalOpen,
  ]);

  useEffect(() => {
    if (selectedTranche) {
      setPageSelections((prev) => ({
        ...prev,
        [skip]: selectedTranche?.id,
      }));
    }
  }, [selectedTranche, skip]);

  const moveToNextPendingTranche = () => {
    if (!selectedTranche) return;

    const currentIndex =
      tranches?.findIndex((tranche) => tranche.id === selectedTranche.id) || 0;
    if (currentIndex === -1) return;

    const nextPendingTranche = tranches
      ?.slice(currentIndex + 1)
      .find((tranche) => tranche.status === GrantApplicationStatus.Pending);

    if (nextPendingTranche) {
      setSelectedTranche(nextPendingTranche);
    }
  };

  const rejectGrantMutation = useMutation({
    mutationFn: async (trancheId: string) => {
      const response = await api.post(
        '/api/sponsor-dashboard/grants/update-application-status',
        {
          data: [{ id: trancheId }],
          applicationStatus: 'Rejected',
        },
      );
      return response.data;
    },
    onMutate: async (trancheId) => {
      const previousTranches = queryClient.getQueryData<TranchesReturn>([
        'sponsor-tranches',
        grant?.slug,
        params,
      ]);

      queryClient.setQueryData<TranchesReturn>(
        ['sponsor-tranches', grant?.slug, params],
        (oldData) => {
          if (!oldData) return oldData;
          const updatedTranches = oldData.data.map((tranche) =>
            tranche.id === trancheId
              ? {
                  ...tranche,
                  applicationStatus: GrantApplicationStatus.Rejected,
                }
              : tranche,
          );
          const updatedTranche = updatedTranches.find(
            (tranche) => tranche.id === trancheId,
          );
          setSelectedTranche(updatedTranche);
          moveToNextPendingTranche();
          return {
            ...oldData,
            data: updatedTranches,
          };
        },
      );

      return { previousTranches };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData<TranchesReturn>(
        ['sponsor-tranches', grant?.slug, params],
        context?.previousTranches,
      );
      toast.error('Failed to reject grant. Please try again.');
    },
  });

  const approveGrantMutation = useMutation({
    mutationFn: async ({
      trancheId,
      approvedAmount,
    }: {
      trancheId: string;
      approvedAmount: number;
    }) => {
      const response = await api.post(
        '/api/sponsor-dashboard/grants/update-application-status',
        {
          data: [{ id: trancheId, approvedAmount }],
          applicationStatus: 'Approved',
        },
      );
      return response.data;
    },
    onMutate: async ({ trancheId, approvedAmount }) => {
      const previousTranches = queryClient.getQueryData<TranchesReturn>([
        'sponsor-tranches',
        grant?.slug,
        params,
      ]);

      queryClient.setQueryData<TranchesReturn>(
        ['sponsor-tranches', grant?.slug, params],
        (oldData) => {
          if (!oldData) return oldData;
          const updatedTranches = oldData.data.map((tranche) =>
            tranche.id === trancheId
              ? {
                  ...tranche,
                  applicationStatus: GrantApplicationStatus.Approved,
                  approvedAmount: approvedAmount,
                }
              : tranche,
          );
          const updatedTranche = updatedTranches.find(
            (tranche) => tranche.id === trancheId,
          );
          setSelectedTranche(updatedTranche);
          moveToNextPendingTranche();
          return {
            ...oldData,
            data: updatedTranches,
          };
        },
      );

      return { previousTranches };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData<TranchesReturn>(
        ['sponsor-tranches', grant?.slug, params],
        context?.previousTranches,
      );
      toast.error('Failed to approve grant. Please try again.');
    },
  });

  const handleApproveTranche = (trancheId: string, approvedAmount: number) => {
    approveGrantMutation.mutate({ trancheId, approvedAmount });
  };

  const handleRejectTranche = (trancheId: string) => {
    rejectGrantMutation.mutate(trancheId);
  };
  return (
    <>
      <div className="flex w-full items-start bg-white">
        <div className="grid min-h-[600px] w-full grid-cols-[23rem_1fr] bg-white">
          <div className="h-full w-full">
            <TrancheList tranches={tranches} setSearchText={setSearchText} />
          </div>

          <div className="h-full w-full rounded-r-xl border-b border-r border-t border-slate-200 bg-white">
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
                approveOnOpen={approveOnOpen}
                rejectedOnOpen={rejectedOnOpen}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-start gap-4">
        {!!searchText ? (
          <p className="text-sm text-slate-400">
            Found <span className="font-bold">{tranches?.length || 0}</span>{' '}
            {tranches?.length === 1 ? 'result' : 'results'}
          </p>
        ) : (
          <>
            <Button
              disabled={skip <= 0}
              onClick={() => changePage(Math.max(skip - length, 0), length - 1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>

            <p className="text-sm text-slate-400">
              <span className="font-bold">{skip + 1}</span> -{' '}
              <span className="font-bold">
                {Math.min(skip + length, totalCount)}
              </span>{' '}
              of <span className="font-bold">{totalCount}</span> Tranches
            </p>

            <Button
              disabled={
                totalCount! <= skip + length ||
                (skip > 0 && skip % length !== 0)
              }
              onClick={() => changePage(skip + length, 0)}
              size="sm"
              variant="outline"
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      <RejectTrancheModal
        trancheId={selectedTranche?.id}
        rejectIsOpen={rejectedIsOpen}
        rejectOnClose={rejectedOnClose}
        ask={selectedTranche?.GrantApplication?.approvedAmount}
        granteeName={selectedTranche?.GrantApplication?.user?.firstName}
        token={grant?.token || 'USDC'}
        onRejectTranche={handleRejectTranche}
      />

      <ApproveTrancheModal
        trancheId={selectedTranche?.id}
        approveIsOpen={approveIsOpen}
        approveOnClose={approveOnClose}
        ask={selectedTranche?.GrantApplication?.ask}
        granteeName={selectedTranche?.GrantApplication?.user?.firstName}
        token={grant?.token || 'USDC'}
        onApproveTranche={handleApproveTranche}
        max={grant?.maxReward}
      />
    </>
  );
};
