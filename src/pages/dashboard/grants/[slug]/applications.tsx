import { GrantApplicationStatus, type SubmissionLabels } from '@prisma/client';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDisclosure } from '@/hooks/use-disclosure';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

import { ApplicationDetails } from '@/features/sponsor-dashboard/components/GrantApplications/ApplicationDetails';
import { ApplicationHeader } from '@/features/sponsor-dashboard/components/GrantApplications/ApplicationHeader';
import { ApplicationList } from '@/features/sponsor-dashboard/components/GrantApplications/ApplicationList';
import { RejectAllGrantApplicationModal } from '@/features/sponsor-dashboard/components/GrantApplications/Modals/RejectAllModal';
import { PaymentsHistoryTab } from '@/features/sponsor-dashboard/components/GrantApplications/PaymentsHistoryTab';
import { applicationsQuery } from '@/features/sponsor-dashboard/queries/applications';
import { sponsorGrantQuery } from '@/features/sponsor-dashboard/queries/grant';
import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard/types';

interface Props {
  slug: string;
}

function GrantApplications({ slug }: Props) {
  const { user } = useUser();
  const router = useRouter();
  const [selectedApplication, setSelectedApplication] =
    useState<GrantApplicationWithUser>();
  const [skip, setSkip] = useState(0);
  let length = 20;
  const [searchText, setSearchText] = useState('');
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<
    Set<string>
  >(new Set());
  const [filterLabel, setFilterLabel] = useState<
    SubmissionLabels | GrantApplicationStatus | undefined
  >(undefined);

  const queryClient = useQueryClient();

  const [isToggledAll, setIsToggledAll] = useState(false);
  const {
    isOpen: isTogglerOpen,
    onOpen: onTogglerOpen,
    onClose: onTogglerClose,
  } = useDisclosure();
  const {
    isOpen: rejectedIsOpen,
    onOpen: rejectedOnOpen,
    onClose: rejectedOnClose,
  } = useDisclosure();

  const params = { searchText, length, skip, filterLabel };

  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    ...applicationsQuery(slug, params),
    retry: false,
    placeholderData: keepPreviousData,
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

  const { data: grant, isLoading: isGrantLoading } = useQuery(
    sponsorGrantQuery(slug, user?.currentSponsorId),
  );

  const rejectGrantMutation = useMutation({
    mutationFn: async (applicationIds: string[]) => {
      const batchSize = 10;
      for (let i = 0; i < applicationIds.length; i += batchSize) {
        const batch = applicationIds.slice(i, i + batchSize);
        await axios.post(
          `/api/sponsor-dashboard/grants/update-application-status`,
          {
            data: batch.map((a) => ({ id: a })),
            applicationStatus: 'Rejected',
          },
        );
      }
    },
    onMutate: async (applicationIds) => {
      queryClient.setQueryData(
        ['sponsor-applications', slug, params],
        (old: any) => {
          if (!old) return old;
          return old.map((application: GrantApplicationWithUser) =>
            applicationIds.includes(application.id)
              ? {
                  ...application,
                  applicationStatus: GrantApplicationStatus.Rejected,
                }
              : application,
          );
        },
      );
    },
    onError: () => {
      toast.error(
        'An error occurred while rejecting applications. Please try again.',
      );
    },
    onSuccess: (_, applicationIds) => {
      queryClient.setQueryData(
        ['sponsor-applications', slug, params],
        (old: any) => {
          if (!old) return old;
          return old.map((application: GrantApplicationWithUser) =>
            applicationIds.includes(application.id)
              ? {
                  ...application,
                  applicationStatus: GrantApplicationStatus.Rejected,
                }
              : application,
          );
        },
      );

      const updatedApplication = queryClient
        .getQueryData<
          GrantApplicationWithUser[]
        >(['sponsor-applications', slug, params])
        ?.find((application) => applicationIds.includes(application.id));

      setSelectedApplication(updatedApplication);
      setSelectedApplicationIds(new Set());
      toast.success('Applications rejected successfully');
    },
  });

  const handleRejectGrant = (applicationIds: string[]) => {
    rejectGrantMutation.mutate(applicationIds);
    rejectedOnClose();
  };

  useEffect(() => {
    if (grant && grant.sponsorId !== user?.currentSponsorId) {
      router.push('/dashboard/listings');
    }
  }, [grant, user?.currentSponsorId, router]);

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

  const [pageSelections, setPageSelections] = useState<Record<number, string>>(
    {},
  );

  useEffect(() => {
    if (selectedApplication) {
      setPageSelections((prev) => ({
        ...prev,
        [skip]: selectedApplication.id,
      }));
    }
  }, [selectedApplication, skip]);

  const changePage = useCallback(
    async (newSkip: number, selectIndex: number) => {
      if (newSkip < 0 || newSkip >= grant?.totalApplications!) return;
      setSkip(newSkip);
      await new Promise((resolve) => setTimeout(resolve, 0));

      await queryClient.prefetchQuery({
        ...applicationsQuery(slug, { ...params, skip: newSkip }),
        staleTime: Infinity,
      });

      const newApplications = queryClient.getQueryData<
        GrantApplicationWithUser[]
      >(['sponsor-applications', slug, { ...params, skip: newSkip }]);

      if (newApplications && newApplications.length > 0) {
        if (selectIndex === -1) {
          const savedSelectionId = pageSelections[newSkip];
          const savedApplication = savedSelectionId
            ? newApplications.find((app) => app.id === savedSelectionId)
            : null;

          if (savedApplication) {
            setSelectedApplication(savedApplication);
          } else {
            setSelectedApplication(newApplications[0]);
          }
        } else {
          setSelectedApplication(
            newApplications[Math.min(selectIndex, newApplications.length - 1)],
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
          } else if (skip + length < grant?.totalApplications!) {
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
          if (skip + length < grant?.totalApplications!) {
            await changePage(skip + length, -1);
          }
          break;
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
  ]);
  return (
    <SponsorLayout isCollapsible>
      {isGrantLoading ? (
        <LoadingSection />
      ) : (
        <>
          <ApplicationHeader grant={grant} />
          <Tabs defaultValue="applications">
            <TabsList className="gap-4 font-medium text-slate-400">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="payments">Payments History</TabsTrigger>
            </TabsList>
            <div className="h-0.5 w-full bg-slate-200" />
            <TabsContent value="applications" className="w-full px-0">
              <div className="flex w-full items-start bg-white">
                <div className="grid min-h-[600px] w-full grid-cols-[23rem_1fr] bg-white">
                  <div className="h-full w-full">
                    <ApplicationList
                      filterLabel={filterLabel}
                      setFilterLabel={setFilterLabel}
                      applications={applications}
                      setSearchText={setSearchText}
                      selectedApplication={selectedApplication}
                      setSelectedApplication={setSelectedApplication}
                      isToggled={isToggled}
                      toggleApplication={toggleApplication}
                      isAllToggled={isToggledAll}
                      toggleAllApplications={toggleAllApplications}
                      isToggleDisabled={
                        applications?.filter(
                          (application) =>
                            application.applicationStatus === 'Pending',
                        ).length === 0
                      }
                    />
                  </div>

                  <div className="h-full w-full rounded-r-xl border-b border-r border-t border-slate-200 bg-white">
                    {!applications?.length &&
                    !searchText &&
                    !isApplicationsLoading ? (
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
                        selectedApplication={selectedApplication}
                        setSelectedApplication={setSelectedApplication}
                        params={params}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-start gap-4">
                {!!searchText ? (
                  <p className="text-sm text-slate-400">
                    Found{' '}
                    <span className="font-bold">
                      {applications?.length || 0}
                    </span>{' '}
                    {applications?.length === 1 ? 'result' : 'results'}
                  </p>
                ) : (
                  <>
                    <Button
                      disabled={skip <= 0}
                      onClick={() =>
                        changePage(Math.max(skip - length, 0), length - 1)
                      }
                      size="sm"
                      variant="outline"
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      Previous
                    </Button>

                    <p className="text-sm text-slate-400">
                      <span className="font-bold">{skip + 1}</span> -{' '}
                      <span className="font-bold">
                        {Math.min(skip + length, grant?.totalApplications!)}
                      </span>{' '}
                      of{' '}
                      <span className="font-bold">
                        {grant?.totalApplications}
                      </span>{' '}
                      Applications
                    </p>

                    <Button
                      disabled={
                        grant?.totalApplications! <= skip + length ||
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
            </TabsContent>

            <TabsContent value="payments" className="px-0">
              <PaymentsHistoryTab grant={grant} grantId={grant?.id} />
            </TabsContent>
          </Tabs>
          <Popover
            modal={true}
            onOpenChange={onTogglerClose}
            open={isTogglerOpen}
          >
            <PopoverContent
              className="fixed bottom-10 mx-auto w-full border-none bg-transparent p-0 shadow-none"
              align="center"
            >
              <div className="mx-auto w-fit rounded-lg border-2 border-slate-200 bg-white px-4 shadow-lg">
                {selectedApplicationIds.size > 100 && (
                  <p className="pb-2 text-center text-red-500">
                    Cannot select more than 100 applications
                  </p>
                )}

                <div className="flex items-center gap-4 text-lg">
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
                    onClick={rejectedOnOpen}
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
            </PopoverContent>
          </Popover>

          <RejectAllGrantApplicationModal
            applicationIds={Array.from(selectedApplicationIds)}
            rejectIsOpen={rejectedIsOpen}
            rejectOnClose={rejectedOnClose}
            onRejectGrant={handleRejectGrant}
          />
        </>
      )}
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default GrantApplications;
