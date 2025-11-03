import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { useDisclosure } from '@/hooks/use-disclosure';
import { api } from '@/lib/api';
import { GrantTrancheStatus } from '@/prisma/enums';
import { useUser } from '@/store/user';

import { selectedGrantTrancheAtom, tranchesAtom } from '../atoms';
import { sponsorGrantQuery } from '../queries/grant';
import {
  type GrantTrancheWithApplication,
  tranchesQuery,
  type TranchesReturn,
} from '../queries/tranches';
import { ApproveTrancheModal } from './Traches/ApproveTrancheModal';
import { RejectTrancheModal } from './Traches/RejectTrancheModal';
import { TrancheDetails } from './Traches/TrancheDetails';
import { TrancheList } from './Traches/TrancheList';

interface Props {
  slug: string;
}

export const TranchesTab = ({ slug }: Props) => {
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<
    Set<GrantTrancheStatus>
  >(new Set());

  const [allTranches, setAllTranches] = useAtom(tranchesAtom);

  const { data: trancheReturn, isLoading: isTrancheLoading } = useQuery({
    ...tranchesQuery(slug),
    retry: false,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (trancheReturn?.data) {
      setAllTranches(trancheReturn.data);
    }
  }, [trancheReturn?.data, setAllTranches]);

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

  const { user } = useUser();

  const { data: grant } = useQuery(
    sponsorGrantQuery(slug, user?.currentSponsorId),
  );

  const queryClient = useQueryClient();

  const [selectedTranche, setSelectedTranche] = useAtom(
    selectedGrantTrancheAtom,
  );

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

  const rejectGrantMutation = useMutation({
    mutationFn: async (trancheId: string) => {
      await api.post('/api/sponsor-dashboard/grants/update-tranche-status', {
        id: trancheId,
        status: 'Rejected',
      });
    },
    onMutate: async (trancheId) => {
      const previousTranches = queryClient.getQueryData<TranchesReturn>([
        'sponsor-tranches',
        grant?.slug,
      ]);

      queryClient.setQueryData<TranchesReturn>(
        ['sponsor-tranches', grant?.slug],
        (oldData) => {
          if (!oldData) return oldData;
          const updatedTranches = oldData.data.map(
            (tranche: GrantTrancheWithApplication) =>
              tranche.id === trancheId
                ? {
                    ...tranche,
                    status: GrantTrancheStatus.Rejected,
                  }
                : tranche,
          );
          const updatedTranche = updatedTranches.find(
            (tranche: GrantTrancheWithApplication) => tranche.id === trancheId,
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
        ['sponsor-tranches', grant?.slug],
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
      await api.post('/api/sponsor-dashboard/grants/update-tranche-status', {
        id: trancheId,
        status: 'Approved',
        approvedAmount,
      });
    },
    onMutate: async ({ trancheId, approvedAmount }) => {
      const previousTranches = queryClient.getQueryData<TranchesReturn>([
        'sponsor-tranches',
        grant?.slug,
      ]);

      queryClient.setQueryData<TranchesReturn>(
        ['sponsor-tranches', grant?.slug],
        (oldData) => {
          if (!oldData) return oldData;
          const updatedTranches = oldData.data.map(
            (tranche: GrantTrancheWithApplication) =>
              tranche.id === trancheId
                ? {
                    ...tranche,
                    status: GrantTrancheStatus.Approved,
                    approvedAmount,
                  }
                : tranche,
          );
          const updatedTranche = updatedTranches.find(
            (tranche: GrantTrancheWithApplication) => tranche.id === trancheId,
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
        ['sponsor-tranches', grant?.slug],
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
        token={grant?.token || 'USDC'}
        onRejectTranche={handleRejectTranche}
      />

      <ApproveTrancheModal
        trancheId={selectedTranche?.id}
        approveIsOpen={approveIsOpen}
        approveOnClose={approveOnClose}
        ask={selectedTranche?.ask}
        granteeName={selectedTranche?.GrantApplication?.user?.firstName}
        token={grant?.token || 'USDC'}
        onApproveTranche={handleApproveTranche}
        grantApprovedAmount={
          selectedTranche?.GrantApplication?.approvedAmount || 0
        }
        grantTotalPaid={selectedTranche?.GrantApplication?.totalPaid || 0}
      />
    </>
  );
};
