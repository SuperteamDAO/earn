import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
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
  useDisclosure,
} from '@chakra-ui/react';
import { GrantApplicationStatus } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { type Grant } from '@/features/grants';
import {
  ApplicationDetails,
  ApplicationHeader,
  ApplicationList,
  type GrantApplicationWithUser,
  PaymentsHistoryTab,
  RejectAllModal,
} from '@/features/sponsor-dashboard';
import { Sidebar } from '@/layouts/Sponsor';
import { userStore } from '@/store/user';

interface Props {
  slug: string;
}

const selectedStyles = {
  borderColor: 'brand.purple',
  color: 'brand.slate.600',
};

function GrantApplications({ slug }: Props) {
  const router = useRouter();
  const { userInfo } = userStore();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [totalApplications, setTotalApplications] = useState(0);
  const [applications, setApplications] = useState<GrantApplicationWithUser[]>(
    [],
  );
  const [selectedApplication, setSelectedApplication] =
    useState<GrantApplicationWithUser>();
  const [isGrantLoading, setIsGrantLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  let length = 20;
  const [searchText, setSearchText] = useState('');
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<
    Set<string>
  >(new Set());

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

  useEffect(() => {
    selectedApplicationIds.size > 0 ? onTogglerOpen() : onTogglerClose();
  }, [selectedApplicationIds]);

  useEffect(() => {
    setIsToggledAll(isAllCurrentToggled());
  }, [selectedApplicationIds, applications]);

  useEffect(() => {
    const newSet = new Set(selectedApplicationIds);
    Array.from(selectedApplicationIds).forEach((a) => {
      const applicationWithId = applications.find(
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
      .filter((application) => application.applicationStatus === 'Pending')
      .every((application) => selectedApplicationIds.has(application.id));

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
          .filter((application) => application.applicationStatus === 'Pending')
          .map((application) => newSet.add(application.id));
        return newSet;
      });
    } else {
      setSelectedApplicationIds((prev) => {
        const newSet = new Set(prev);
        applications.map((application) => newSet.delete(application.id));
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

  const getGrant = async () => {
    setIsGrantLoading(true);
    try {
      const grantDetails = await axios.get(
        `/api/sponsor-dashboard/grants/${slug}/`,
      );
      setGrant(grantDetails.data);
      if (grantDetails.data.sponsorId !== userInfo?.currentSponsorId) {
        router.push('/dashboard/listings');
      }

      setTotalApplications(grantDetails.data.totalApplications);
      setIsGrantLoading(false);
    } catch (e) {
      setIsGrantLoading(false);
    }
  };

  const getApplications = async () => {
    try {
      setIsLoading(true);
      const applicationDetails = await axios.get(
        `/api/sponsor-dashboard/grants/${slug}/applications/`,
        {
          params: {
            searchText,
            take: length,
            skip,
          },
        },
      );
      setApplications(applicationDetails.data);
      setSelectedApplication(applicationDetails.data[0]);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getApplications();
    }
  }, [userInfo?.currentSponsorId, skip, searchText]);

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getGrant();
    }
  }, [userInfo?.currentSponsorId]);

  const handleRejectGrant = async (applicationIds: string[]) => {
    const updatedApplications = applications.map((application) =>
      applicationIds.includes(application.id)
        ? {
            ...application,
            applicationStatus: GrantApplicationStatus.Rejected,
          }
        : application,
    );

    setApplications(updatedApplications);
    const updatedApplication = updatedApplications.find((application) =>
      applicationIds.includes(application.id),
    );
    setSelectedApplication(updatedApplication);
    rejectedOnClose();

    const batchSize = 10;
    for (let i = 0; i < applicationIds.length; i += batchSize) {
      const batch = applicationIds.slice(i, i + batchSize);
      try {
        await axios.post(
          `/api/sponsor-dashboard/grants/update-application-status`,
          {
            data: batch.map((a) => ({ id: a })),
            applicationStatus: 'Rejected',
          },
        );
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
      }
    }
    setSelectedApplicationIds(new Set());
  };
  return (
    <Sidebar>
      {isGrantLoading ? (
        <LoadingSection />
      ) : (
        <>
          <ApplicationHeader
            grant={grant}
            totalApplications={totalApplications}
          />
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
              <TabPanel px={0}>
                {!applications?.length && !searchText && !isLoading ? (
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
                      You have not received any applications yet
                    </Text>
                    <Text
                      mx="auto"
                      mb={200}
                      color={'brand.slate.400'}
                      fontWeight={500}
                      textAlign={'center'}
                    >
                      Once you start receiving applications, you will be able to
                      review them here.
                    </Text>
                  </>
                ) : (
                  <>
                    <Flex align={'start'} bg="white">
                      <Flex flex="4 1 auto" minH="600px">
                        <ApplicationList
                          applications={applications}
                          setSearchText={setSearchText}
                          selectedApplication={selectedApplication}
                          setSelectedApplication={setSelectedApplication}
                          isToggled={isToggled}
                          toggleApplication={toggleApplication}
                          isAllToggled={isToggledAll}
                          toggleAllApplications={toggleAllApplications}
                        />
                        <ApplicationDetails
                          isMultiSelectOn={selectedApplicationIds.size > 0}
                          grant={grant}
                          applications={applications}
                          setApplications={setApplications}
                          selectedApplication={selectedApplication}
                          setSelectedApplication={setSelectedApplication}
                        />
                      </Flex>
                    </Flex>
                    <Flex align="center" justify="start" gap={4} mt={4}>
                      {!!searchText ? (
                        <Text color="brand.slate.400" fontSize="sm">
                          Found{' '}
                          <Text as="span" fontWeight={700}>
                            {applications.length}
                          </Text>{' '}
                          {applications.length === 1 ? 'result' : 'results'}
                        </Text>
                      ) : (
                        <>
                          <Button
                            isDisabled={skip <= 0}
                            leftIcon={<ChevronLeftIcon w={5} h={5} />}
                            onClick={() =>
                              skip >= length
                                ? setSkip(skip - length)
                                : setSkip(0)
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
                              {Math.min(skip + length, totalApplications)}
                            </Text>{' '}
                            of{' '}
                            <Text as="span" fontWeight={700}>
                              {totalApplications}
                            </Text>{' '}
                            Applications
                          </Text>
                          <Button
                            isDisabled={
                              totalApplications <= skip + length ||
                              (skip > 0 && skip % length !== 0)
                            }
                            onClick={() =>
                              skip % length === 0 && setSkip(skip + length)
                            }
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
                )}
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
          <RejectAllModal
            applicationIds={Array.from(selectedApplicationIds)}
            rejectIsOpen={rejectedIsOpen}
            rejectOnClose={rejectedOnClose}
            onRejectGrant={handleRejectGrant}
          />
        </>
      )}
    </Sidebar>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default GrantApplications;
