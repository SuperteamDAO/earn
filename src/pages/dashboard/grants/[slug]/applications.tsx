import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  HStack,
  Image,
  Popover,
  PopoverBody,
  PopoverContent,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { GrantApplicationStatus, type SubmissionLabels } from '@prisma/client';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LoadingSection } from '@/components/shared/LoadingSection';
import {
  ApplicationDetails,
  ApplicationHeader,
  ApplicationList,
  applicationsQuery,
  type GrantApplicationWithUser,
  PaymentsHistoryTab,
  RejectAllGrantApplicationModal,
  sponsorGrantQuery,
} from '@/features/sponsor-dashboard';
import { useDisclosure } from '@/hooks/use-disclosure';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

interface Props {
  slug: string;
}

const selectedStyles = {
  borderColor: 'brand.purple',
  color: 'brand.slate.600',
};

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
          <Tabs defaultIndex={0}>
            <TabList
              gap={4}
              color="brand.slate.400"
              fontWeight={500}
              borderBottomWidth={'1px'}
            >
              <Tab
                px={1}
                fontSize="sm"
                fontWeight={500}
                _selected={selectedStyles}
              >
                Applications
              </Tab>
              <Tab
                px={1}
                fontSize="sm"
                fontWeight={500}
                _selected={selectedStyles}
              >
                Payments History
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel w="full" px={0}>
                <>
                  <Flex align={'start'} w="full" bg="white">
                    <Grid
                      templateColumns="23rem 1fr"
                      w="full"
                      minH="600px"
                      bg="white"
                    >
                      <GridItem w="full" h="full">
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
                      </GridItem>
                      <GridItem
                        w="full"
                        h="full"
                        bg="white"
                        borderColor="brand.slate.200"
                        borderTopWidth="1px"
                        borderRightWidth={'1px'}
                        borderBottomWidth="1px"
                        roundedRight={'xl'}
                      >
                        {!applications?.length &&
                        !searchText &&
                        !isApplicationsLoading ? (
                          <>
                            <Image
                              w={32}
                              mx="auto"
                              mt={32}
                              alt={'talent empty'}
                              src="/assets/bg/talent-empty.svg"
                            />
                            <Text
                              mx="auto"
                              mt={5}
                              color={'brand.slate.600'}
                              fontSize={'lg'}
                              fontWeight={600}
                              textAlign={'center'}
                            >
                              {filterLabel
                                ? `Zero Results`
                                : 'People are working!'}
                            </Text>
                            <Text
                              mx="auto"
                              mb={200}
                              color={'brand.slate.400'}
                              fontWeight={500}
                              textAlign={'center'}
                            >
                              {filterLabel
                                ? `For the filters you have selected`
                                : 'Submissions will start appearing here'}
                            </Text>
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
                      </GridItem>
                    </Grid>
                  </Flex>
                  <Flex align="center" justify="start" gap={4} mt={4}>
                    {!!searchText ? (
                      <Text color="brand.slate.400" fontSize="sm">
                        Found{' '}
                        <Text as="span" fontWeight={700}>
                          {applications?.length || 0}
                        </Text>{' '}
                        {applications?.length === 1 ? 'result' : 'results'}
                      </Text>
                    ) : (
                      <>
                        <Button
                          isDisabled={skip <= 0}
                          leftIcon={<ChevronLeftIcon w={5} h={5} />}
                          onClick={() =>
                            changePage(Math.max(skip - length, 0), length - 1)
                          }
                          size="sm"
                          variant="outline"
                        >
                          Previous
                        </Button>
                        <Text color="brand.slate.400" fontSize="sm">
                          <Text as="span" fontWeight={700}>
                            {skip + 1}
                          </Text>{' '}
                          -{' '}
                          <Text as="span" fontWeight={700}>
                            {Math.min(skip + length, grant?.totalApplications!)}
                          </Text>{' '}
                          of{' '}
                          <Text as="span" fontWeight={700}>
                            {grant?.totalApplications}
                          </Text>{' '}
                          Applications
                        </Text>
                        <Button
                          isDisabled={
                            grant?.totalApplications! <= skip + length ||
                            (skip > 0 && skip % length !== 0)
                          }
                          onClick={() => changePage(skip + length, 0)}
                          rightIcon={<ChevronRightIcon w={5} h={5} />}
                          size="sm"
                          variant="outline"
                        >
                          Next
                        </Button>
                      </>
                    )}
                  </Flex>
                </>
              </TabPanel>
              <TabPanel px={0}>
                <PaymentsHistoryTab grant={grant} grantId={grant?.id} />
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Popover
            closeOnBlur={false}
            closeOnEsc={false}
            isOpen={isTogglerOpen}
            onClose={onTogglerClose}
          >
            <PopoverContent
              pos="fixed"
              bottom={10}
              w="full"
              mx="auto"
              p={0}
              bg="transparent"
              border="none"
              shadow="none"
            >
              <PopoverBody
                w="fit-content"
                mx="auto"
                px={4}
                bg="white"
                borderWidth={2}
                borderColor="brand.slate.200"
                shadow="lg"
                rounded={'lg'}
              >
                {selectedApplicationIds.size > 100 && (
                  <Text pb={2} color="red" textAlign="center">
                    Cannot select more than 100 applications
                  </Text>
                )}
                <HStack gap={4} fontSize={'lg'}>
                  <HStack fontWeight={500}>
                    <Text>{selectedApplicationIds.size}</Text>
                    <Text color="brand.slate.500">Selected</Text>
                  </HStack>
                  <Box w="1px" h={4} bg="brand.slate.300" />
                  <Button
                    fontWeight={500}
                    bg="transparent"
                    onClick={() => {
                      setSelectedApplicationIds(new Set());
                    }}
                    variant="link"
                  >
                    UNSELECT ALL
                  </Button>
                  <Button
                    gap={2}
                    color="#E11D48"
                    fontWeight={500}
                    bg="#FEF2F2"
                    isDisabled={
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
                </HStack>
              </PopoverBody>
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
