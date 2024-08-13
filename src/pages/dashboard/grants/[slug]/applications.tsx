import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Image,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { type Grant } from '@/features/grants';
import {
  ApplicationDetails,
  ApplicationHeader,
  ApplicationList,
  type GrantApplicationWithUser,
  PaymentsHistoryTab,
} from '@/features/sponsor-dashboard';
import { Sidebar } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

interface Props {
  slug: string;
}

const selectedStyles = {
  borderColor: 'brand.purple',
  color: 'brand.slate.600',
};

function GrantApplications({ slug }: Props) {
  const router = useRouter();
  const { user } = useUser();
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
      if (grantDetails.data.sponsorId !== user?.currentSponsorId) {
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
    if (user?.currentSponsorId) {
      getApplications();
    }
  }, [user?.currentSponsorId, skip, searchText]);

  useEffect(() => {
    if (user?.currentSponsorId) {
      getGrant();
    }
  }, [user?.currentSponsorId]);

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
                        />
                        <ApplicationDetails
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
