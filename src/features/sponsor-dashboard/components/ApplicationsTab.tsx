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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDisclosure } from '@/hooks/use-disclosure';
import {
  GrantApplicationStatus,
  type SubmissionLabels,
} from '@/interface/prisma/enums';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { applicationsAtom, selectedGrantApplicationAtom } from '../atoms';
import {
  applicationsQuery,
  type GrantApplicationsReturn,
} from '../queries/applications';
import { sponsorGrantQuery } from '../queries/grant';
import { type GrantApplicationWithUser } from '../types';
import { ApplicationDetails } from './GrantApplications/ApplicationDetails';
import { ApplicationList } from './GrantApplications/ApplicationList';
import { ApproveModal } from './GrantApplications/Modals/ApproveModal';
import { RejectAllGrantApplicationModal } from './GrantApplications/Modals/RejectAllModal';
import { RejectGrantApplicationModal } from './GrantApplications/Modals/RejectModal';

interface Props {
  slug: string;
}

export const ApplicationsTab = ({ slug }: Props) => {
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const [filterLabel, setFilterLabel] = useState<
    SubmissionLabels | GrantApplicationStatus | undefined
  >(undefined);

  const params = { searchText, length: 20, skip, filterLabel };

  const [applications, setApplications] = useAtom(applicationsAtom);

  const { data: applicationReturn, isLoading: isApplicationsLoading } =
    useQuery({
      ...applicationsQuery(slug, params),
      retry: false,
      placeholderData: keepPreviousData,
    });

  useEffect(() => {
    if (applicationReturn?.data) {
      setApplications(applicationReturn.data);
    }
  }, [applicationReturn?.data, setApplications]);

  const totalCount = useMemo(
    () => applicationReturn?.count || 0,
    [applicationReturn],
  );

  const [isToggledAll, setIsToggledAll] = useState(false);
  let length = 20;
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<
    Set<string>
  >(new Set());
  const [pageSelections, setPageSelections] = useState<Record<number, string>>(
    {},
  );

  const { user } = useUser();

  const { data: grant } = useQuery(
    sponsorGrantQuery(slug, user?.currentSponsorId),
  );

  const queryClient = useQueryClient();

  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
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

  const isAnyModalOpen = rejectedIsOpen || approveIsOpen || isTogglerOpen;

  const changePage = useCallback(
    async (newSkip: number, selectIndex: number) => {
      if (newSkip < 0 || newSkip >= grant?.totalApplications!) return;
      setSkip(newSkip);
      await new Promise((resolve) => setTimeout(resolve, 0));

      await queryClient.prefetchQuery({
        ...applicationsQuery(slug, { ...params, skip: newSkip }),
        staleTime: Infinity,
      });

      const newApplications = queryClient.getQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', slug, { ...params, skip: newSkip }],
      );
      setApplications(newApplications?.data || []);

      if (newApplications && newApplications.count > 0) {
        if (selectIndex === -1) {
          const savedSelectionId = pageSelections[newSkip];
          const savedApplication = savedSelectionId
            ? newApplications.data.find((app) => app.id === savedSelectionId)
            : null;

          if (savedApplication) {
            setSelectedApplication(savedApplication);
          } else {
            setSelectedApplication(newApplications.data[0]);
          }
        } else {
          setSelectedApplication(
            newApplications.data[
              Math.min(selectIndex, newApplications.data.length - 1)
            ],
          );
        }
      }
    },
    [
      queryClient,
      slug,
      params,
      grant?.totalApplications,
      setSelectedApplication,
      pageSelections,
    ],
  );

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!applications?.length) return;

      if (!isAnyModalOpen) {
        const currentIndex = applications.findIndex(
          (app) => app.id === selectedApplication?.id,
        );

        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            if (currentIndex > 0) {
              setSelectedApplication(applications[currentIndex - 1]);
            } else if (skip > 0) {
              // When going to the previous page, select the last item
              await changePage(Math.max(skip - length, 0), length - 1);
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (currentIndex < applications.length - 1) {
              setSelectedApplication(applications[currentIndex + 1]);
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
    applications,
    selectedApplication,
    skip,
    length,
    grant?.totalApplications,
    changePage,
    isAnyModalOpen,
  ]);

  useEffect(() => {
    if (selectedApplication) {
      setPageSelections((prev) => ({
        ...prev,
        [skip]: selectedApplication.id,
      }));
    }
  }, [selectedApplication, skip]);

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

  const rejectMultipleGrantMutation = useMutation({
    mutationFn: async (applicationIds: string[]) => {
      const batchSize = 10;
      for (let i = 0; i < applicationIds.length; i += batchSize) {
        const batch = applicationIds.slice(i, i + batchSize);
        await api.post(
          `/api/sponsor-dashboard/grants/update-application-status`,
          {
            data: batch.map((a) => ({ id: a })),
            applicationStatus: 'Rejected',
          },
        );
      }
    },
    onMutate: async (applicationIds) => {
      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', slug, params],
        (old) => {
          if (!old) return old;
          const data = old.data.map((application: GrantApplicationWithUser) =>
            applicationIds.includes(application.id)
              ? {
                  ...application,
                  applicationStatus: GrantApplicationStatus.Rejected,
                  label:
                    application.label === 'Unreviewed' ||
                    application.label === 'Pending'
                      ? 'Reviewed'
                      : application.label,
                }
              : application,
          );
          if (selectedApplication?.id) {
            const updatedApplication = data.find(
              (application) => application.id === selectedApplication?.id,
            );
            setSelectedApplication(updatedApplication);
          }
          return {
            ...old,
            data,
          };
        },
      );
    },
    onError: () => {
      toast.error(
        'An error occurred while rejecting applications. Please try again.',
      );
    },
    onSuccess: (_, applicationIds) => {
      queryClient.invalidateQueries({
        queryKey: ['sponsor-applications', slug],
      });

      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', slug, params],
        (old) => {
          if (!old) return old;
          const data = old.data.map((application: GrantApplicationWithUser) =>
            applicationIds.includes(application.id)
              ? {
                  ...application,
                  applicationStatus: GrantApplicationStatus.Rejected,
                  label:
                    application.label === 'Unreviewed' ||
                    application.label === 'Pending'
                      ? 'Reviewed'
                      : application.label,
                }
              : application,
          );
          if (selectedApplication?.id) {
            const updatedApplication = data.find(
              (application) => application.id === selectedApplication?.id,
            );
            setSelectedApplication(updatedApplication);
          }
          return {
            ...old,
            data,
          };
        },
      );

      const updatedApplication = queryClient
        .getQueryData<GrantApplicationsReturn>([
          'sponsor-applications',
          slug,
          params,
        ])
        ?.data?.find((application) => applicationIds.includes(application.id));

      setSelectedApplication(updatedApplication);
      setSelectedApplicationIds(new Set());
      toast.success('Applications rejected successfully');
    },
  });

  const moveToNextPendingApplication = () => {
    if (!selectedApplication) return;

    const currentIndex =
      applications?.findIndex((app) => app.id === selectedApplication.id) || 0;
    if (currentIndex === -1) return;

    const nextPendingApplication = applications
      ?.slice(currentIndex + 1)
      .find((app) => app.applicationStatus === GrantApplicationStatus.Pending);

    if (nextPendingApplication) {
      setSelectedApplication(nextPendingApplication);
    }
  };

  const handleRejectMultipleGrants = (applicationIds: string[]) => {
    rejectMultipleGrantMutation.mutate(applicationIds);
    rejectedMultipleOnClose();
  };

  const rejectGrantMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await api.post(
        '/api/sponsor-dashboard/grants/update-application-status',
        {
          data: [{ id: applicationId }],
          applicationStatus: 'Rejected',
        },
      );
      return response.data;
    },
    onMutate: async (applicationId) => {
      const previousApplications =
        queryClient.getQueryData<GrantApplicationsReturn>([
          'sponsor-applications',
          grant?.slug,
          params,
        ]);

      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', grant?.slug, params],
        (oldData) => {
          if (!oldData) return oldData;
          const updatedApplications = oldData.data.map((application) =>
            application.id === applicationId
              ? {
                  ...application,
                  applicationStatus: GrantApplicationStatus.Rejected,
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
          moveToNextPendingApplication();
          return {
            ...oldData,
            data: updatedApplications,
          };
        },
      );

      return { previousApplications };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', grant?.slug, params],
        context?.previousApplications,
      );
      toast.error('Failed to reject grant. Please try again.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sponsor-applications', slug],
      });
    },
  });

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
          params,
        ]);

      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', grant?.slug, params],
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
          moveToNextPendingApplication();
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
        ['sponsor-applications', grant?.slug, params],
        context?.previousApplications,
      );
      toast.error('Failed to approve grant. Please try again.');
    },
  });

  const handleApproveGrant = (
    applicationId: string,
    approvedAmount: number,
  ) => {
    approveGrantMutation.mutate({ applicationId, approvedAmount });
  };

  const handleRejectGrant = (applicationId: string) => {
    rejectGrantMutation.mutate(applicationId);
  };
  return (
    <>
      <div className="flex w-full items-start bg-white">
        <div className="grid min-h-[600px] w-full grid-cols-[23rem_1fr] bg-white">
          <div className="h-full w-full">
            <ApplicationList
              filterLabel={filterLabel}
              setFilterLabel={setFilterLabel}
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
                  {filterLabel ? 'Zero Results' : 'People are working!'}
                </p>
                <p className="mx-auto mb-[200px] text-center font-medium text-slate-400">
                  {filterLabel
                    ? 'For the filters you have selected'
                    : 'Submissions will start appearing here'}
                </p>
              </>
            ) : (
              <ApplicationDetails
                isMultiSelectOn={selectedApplicationIds.size > 0}
                grant={grant}
                applications={applications}
                params={params}
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
            Found <span className="font-bold">{applications?.length || 0}</span>{' '}
            {applications?.length === 1 ? 'result' : 'results'}
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
              of <span className="font-bold">{totalCount}</span> Applications
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

      <Dialog modal={false} onOpenChange={onTogglerClose} open={isTogglerOpen}>
        <DialogContent
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          classNames={{
            overlay: 'hidden',
          }}
          unsetDefaultPosition
          hideCloseIcon
          className="fixed bottom-4 left-1/2 -translate-x-1/2 p-1"
        >
          <div className="mx-auto w-fit rounded-lg bg-white">
            {selectedApplicationIds.size > 100 && (
              <p className="pb-2 text-center text-red-500">
                Cannot select more than 100 applications
              </p>
            )}

            <div className="flex items-center gap-4 text-base">
              <div className="flex items-center font-medium">
                <p>{selectedApplicationIds.size}</p>
                <p className="ml-1 text-slate-500">Selected</p>
              </div>

              <div className="h-4 w-px bg-slate-300" />

              <Button
                className="bg-transparent font-medium hover:bg-transparent"
                onClick={() => {
                  setSelectedApplicationIds(new Set());
                }}
                variant="ghost"
              >
                UNSELECT ALL
              </Button>

              <Button
                className="gap-2 bg-red-50 font-medium text-rose-600 hover:bg-red-50/90 disabled:opacity-50"
                disabled={
                  selectedApplicationIds.size === 0 ||
                  selectedApplicationIds.size > 100
                }
                onClick={rejectedMultipleOnOpen}
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
      <RejectAllGrantApplicationModal
        applicationIds={Array.from(selectedApplicationIds)}
        rejectIsOpen={rejectedMultipleIsOpen}
        rejectOnClose={rejectedMultipleOnClose}
        onRejectGrant={handleRejectMultipleGrants}
      />
    </>
  );
};
