import { GrantApplicationStatus, type SubmissionLabels } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { LucideFlag } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDisclosure } from '@/hooks/use-disclosure';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { applicationsAtom, selectedGrantApplicationAtom } from '../atoms';
import { useRejectGrantApplications } from '../mutations/useRejectGrantApplications';
import {
  applicationsQuery,
  type GrantApplicationsReturn,
} from '../queries/applications';
import { sponsorGrantQuery } from '../queries/grant';
import { ApplicationDetails } from './GrantApplications/ApplicationDetails';
import { ApplicationList } from './GrantApplications/ApplicationList';
import { ApproveModal } from './GrantApplications/Modals/ApproveModal';
import { MultiActionModal } from './GrantApplications/Modals/MultiActionModal';
import { RejectGrantApplicationModal } from './GrantApplications/Modals/RejectModal';

interface Props {
  slug: string;
}

export const ApplicationsTab = ({ slug }: Props) => {
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<
    Set<GrantApplicationStatus | SubmissionLabels>
  >(new Set());

  const [allApplications, setAllApplications] = useAtom(applicationsAtom);

  const { data: applicationReturn, isLoading: isApplicationsLoading } =
    useQuery({
      ...applicationsQuery(slug),
      retry: false,
    });

  useEffect(() => {
    if (applicationReturn?.data) {
      setAllApplications(applicationReturn.data);
    }
  }, [applicationReturn?.data, setAllApplications]);

  const applications = useMemo(() => {
    if (!allApplications) return [];

    let filtered = allApplications;

    if (searchText.trim()) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter((application) => {
        const user = application.user;
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
          application.projectTitle?.toLowerCase().includes(lowerSearchText) ||
          (nameParts.length > 1 &&
            firstName.includes(nameParts[0]?.toLowerCase() || '') &&
            lastName.includes(nameParts[1]?.toLowerCase() || ''))
        );
      });
    }

    if (selectedFilters.size > 0) {
      filtered = filtered.filter((application) => {
        if (selectedFilters.has(application.applicationStatus)) {
          return true;
        }
        if (
          application.applicationStatus === 'Pending' &&
          application.label &&
          selectedFilters.has(application.label)
        ) {
          return true;
        }

        return false;
      });
    }

    return filtered;
  }, [allApplications, searchText, selectedFilters]);

  const [isToggledAll, setIsToggledAll] = useState(false);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<
    Set<string>
  >(new Set());
  const [currentAction, setCurrentAction] = useState<'reject' | 'spam' | null>(
    null,
  );

  const { user } = useUser();

  const { data: grant } = useQuery(
    sponsorGrantQuery(slug, user?.currentSponsorId),
  );

  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!applications.length) return;

      const currentIndex = applications.findIndex(
        (sub) => sub.id === selectedApplication?.id,
      );

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedApplication(applications[currentIndex - 1]);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < applications.length - 1) {
            setSelectedApplication(applications[currentIndex + 1]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [applications, selectedApplication, setSelectedApplication]);

  const rejectGrantApplications = useRejectGrantApplications(slug);

  const queryClient = useQueryClient();

  const approveGrantMutation = useMutation({
    mutationFn: async ({
      applicationId,
      approvedAmount,
    }: {
      applicationId: string;
      approvedAmount: number;
    }) => {
      const response = await api.post(
        '/api/sponsor-dashboard/grants/update-application-status',
        {
          data: [{ id: applicationId, approvedAmount }],
          applicationStatus: 'Approved',
        },
      );
      return response.data;
    },
    onMutate: async ({ applicationId, approvedAmount }) => {
      const previousApplications =
        queryClient.getQueryData<GrantApplicationsReturn>([
          'sponsor-applications',
          grant?.slug,
        ]);

      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', grant?.slug],
        (oldData) => {
          if (!oldData) return oldData;
          const updatedApplications = oldData.data.map((application) =>
            application.id === applicationId
              ? {
                  ...application,
                  applicationStatus: GrantApplicationStatus.Approved,
                  approvedAmount: approvedAmount,
                  label:
                    application.label === 'Unreviewed' ||
                    application.label === 'Pending'
                      ? 'Reviewed'
                      : application.label,
                }
              : application,
          );
          const updatedApplication = updatedApplications.find(
            (application) => application.id === applicationId,
          );
          setSelectedApplication(updatedApplication);
          return {
            ...oldData,
            data: updatedApplications,
          };
        },
      );

      return { previousApplications };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sponsor-applications', slug],
      });
    },
    onError: (_, __, context) => {
      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', grant?.slug],
        context?.previousApplications,
      );
      toast.error('Failed to approve grant. Please try again.');
    },
  });

  useEffect(() => {
    selectedApplicationIds.size > 0 ? onTogglerOpen() : onTogglerClose();
  }, [selectedApplicationIds]);

  useEffect(() => {
    setIsToggledAll(isAllCurrentToggled());
  }, [selectedApplicationIds, applications]);

  useEffect(() => {
    const newSet = new Set(selectedApplicationIds);
    Array.from(selectedApplicationIds).forEach((a) => {
      const applicationWithId = applications?.find(
        (application) => application.id === a,
      );
      if (
        applicationWithId &&
        applicationWithId.applicationStatus !== 'Pending'
      ) {
        newSet.delete(a);
      }
    });
    setSelectedApplicationIds(newSet);
  }, [applications]);

  const isAllCurrentToggled = () =>
    applications
      ?.filter((application) => application.applicationStatus === 'Pending')
      .every((application) => selectedApplicationIds.has(application.id)) ||
    false;

  useEffect(() => {
    if (applications && applications.length > 0) {
      setSelectedApplication((selectedApplication) => {
        if (applications.find((appl) => appl.id === selectedApplication?.id)) {
          return selectedApplication;
        }
        return applications[0];
      });
    }
  }, [applications, searchText]);

  const {
    isOpen: isTogglerOpen,
    onOpen: onTogglerOpen,
    onClose: onTogglerClose,
  } = useDisclosure();
  const {
    isOpen: rejectedMultipleIsOpen,
    onOpen: rejectedMultipleOnOpen,
    onClose: rejectedMultipleOnClose,
  } = useDisclosure();
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

  const toggleApplication = (id: string) => {
    setSelectedApplicationIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        return newSet;
      } else {
        return newSet.add(id);
      }
    });
  };

  const isToggled = useCallback(
    (id: string) => {
      return selectedApplicationIds.has(id);
    },
    [selectedApplicationIds, applications],
  );

  const toggleAllApplications = () => {
    if (!isAllCurrentToggled()) {
      setSelectedApplicationIds((prev) => {
        const newSet = new Set(prev);
        applications
          ?.filter((application) => application.applicationStatus === 'Pending')
          .map((application) => newSet.add(application.id));
        return newSet;
      });
    } else {
      setSelectedApplicationIds((prev) => {
        const newSet = new Set(prev);
        applications?.map((application) => newSet.delete(application.id));
        return newSet;
      });
    }
  };

  const handleRejectGrant = (applicationId: string) => {
    rejectGrantApplications.mutate([applicationId]);
  };

  const handleApproveGrant = (
    applicationId: string,
    approvedAmount: number,
  ) => {
    approveGrantMutation.mutate({ applicationId, approvedAmount });
  };

  const handleModalAction = (actionType: 'reject' | 'spam') => {
    setCurrentAction(actionType);
    rejectedMultipleOnOpen();
  };

  if (isApplicationsLoading) {
    return <LoadingSection />;
  }

  return (
    <>
      <div className="flex w-full items-start bg-white">
        <div className="grid min-h-[600px] w-full grid-cols-[23rem_1fr] bg-white">
          <div className="h-full w-full">
            <ApplicationList
              selectedFilters={selectedFilters}
              onFilterChange={setSelectedFilters}
              applications={applications}
              setSearchText={setSearchText}
              isToggled={isToggled}
              toggleApplication={toggleApplication}
              isAllToggled={isToggledAll}
              toggleAllApplications={toggleAllApplications}
              isToggleDisabled={
                applications?.filter(
                  (application) => application.applicationStatus === 'Pending',
                ).length === 0
              }
            />
          </div>

          <div className="h-full w-full rounded-r-xl border-t border-r border-b border-slate-200 bg-white">
            {!applications?.length && !searchText && !isApplicationsLoading ? (
              <>
                <ExternalImage
                  className="mx-auto mt-32 w-32"
                  alt={'talent empty'}
                  src={'/bg/talent-empty.svg'}
                />
                <p className="mx-auto mt-5 text-center text-lg font-semibold text-slate-600">
                  {selectedFilters.size > 0 || searchText
                    ? 'Zero Results'
                    : 'People are working!'}
                </p>
                <p className="mx-auto mb-[200px] text-center font-medium text-slate-400">
                  {selectedFilters.size > 0 || searchText
                    ? 'For the filters you have selected'
                    : 'Submissions will start appearing here'}
                </p>
              </>
            ) : (
              <ApplicationDetails
                isMultiSelectOn={selectedApplicationIds.size > 0}
                grant={grant}
                applications={applications}
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
            Found <span className="font-bold">{applications?.length || 0}</span>{' '}
            {applications?.length === 1 ? 'result' : 'results'}
          </p>
        )}
      </div>

      <Dialog modal={false} onOpenChange={onTogglerClose} open={isTogglerOpen}>
        <DialogContent
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          classNames={{
            overlay: 'hidden',
          }}
          unsetDefaultPosition
          hideCloseIcon
          className="fixed bottom-4 left-1/2 w-fit max-w-none -translate-x-1/2 overflow-hidden px-5 py-2"
        >
          <div className="mx-auto w-fit rounded-lg">
            {selectedApplicationIds.size > 100 && (
              <p className="pb-2 text-center text-red-500">
                Cannot select more than 100 applications
              </p>
            )}

            <div className="flex items-center gap-3">
              <p className="text-base font-medium whitespace-nowrap">
                {selectedApplicationIds.size} Selected
              </p>

              <div className="h-4 w-px bg-slate-300" />

              <Button
                className="px-2 font-semibold text-slate-500"
                onClick={() => {
                  setSelectedApplicationIds(new Set());
                }}
                variant="ghost"
              >
                UNSELECT ALL
              </Button>

              <Button
                className="rounded-lg border border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50"
                disabled={selectedApplicationIds.size === 0}
                onClick={() => handleModalAction('spam')}
              >
                <LucideFlag className="size-1" />
                Mark as Spam
              </Button>

              <Button
                className="rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                disabled={
                  selectedApplicationIds.size === 0 ||
                  selectedApplicationIds.size > 100
                }
                onClick={() => handleModalAction('reject')}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.11111 0.777832C9.49056 0.777832 12.2222 3.5095 12.2222 6.88894C12.2222 10.2684 9.49056 13.0001 6.11111 13.0001C2.73167 13.0001 0 10.2684 0 6.88894C0 3.5095 2.73167 0.777832 6.11111 0.777832ZM8.305 3.83339L6.11111 6.02728L3.91722 3.83339L3.05556 4.69505L5.24944 6.88894L3.05556 9.08283L3.91722 9.9445L6.11111 7.75061L8.305 9.9445L9.16667 9.08283L6.97278 6.88894L9.16667 4.69505L8.305 3.83339Z"
                    fill="#E11D48"
                  />
                </svg>
                Reject All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RejectGrantApplicationModal
        applicationId={selectedApplication?.id}
        rejectIsOpen={rejectedIsOpen}
        rejectOnClose={rejectedOnClose}
        ask={selectedApplication?.ask}
        granteeName={selectedApplication?.user?.firstName}
        token={grant?.token || 'USDC'}
        onRejectGrant={handleRejectGrant}
      />

      <ApproveModal
        applicationId={selectedApplication?.id}
        approveIsOpen={approveIsOpen}
        approveOnClose={approveOnClose}
        ask={selectedApplication?.ask}
        granteeName={selectedApplication?.user?.firstName}
        token={grant?.token || 'USDC'}
        onApproveGrant={handleApproveGrant}
        max={grant?.maxReward}
      />
      {currentAction && (
        <MultiActionModal
          isOpen={rejectedMultipleIsOpen}
          onClose={() => {
            rejectedMultipleOnClose();
            setCurrentAction(null);
          }}
          applicationIds={Array.from(selectedApplicationIds)}
          setSelectedApplicationIds={setSelectedApplicationIds}
          allApplicationsLength={applications?.length || 0}
          actionType={currentAction}
          slug={slug}
        />
      )}
    </>
  );
};
