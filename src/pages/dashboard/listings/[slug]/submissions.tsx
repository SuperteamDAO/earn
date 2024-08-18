import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Image,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { PublishResults } from '@/features/listings';
import {
  listingQuery,
  type ScoutRowType,
  scoutsQuery,
  ScoutTable,
  SubmissionDetails,
  SubmissionHeader,
  SubmissionList,
  submissionsQuery,
} from '@/features/sponsor-dashboard';
import type { SubmissionWithUser } from '@/interface/submission';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

interface Props {
  slug: string;
}

const selectedStyles = {
  borderColor: 'brand.purple',
  color: 'brand.slate.600',
};

function BountySubmissions({ slug }: Props) {
  // const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();

  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithUser>();
  const [skip, setSkip] = useState(0);
  let length = 10;
  const [searchText, setSearchText] = useState('');

  const { data: bounty, isLoading: isListingLoading } = useQuery(
    listingQuery(slug, user?.currentSponsorId),
  );

  const { data: scouts } = useQuery(
    scoutsQuery({
      bountyId: bounty?.id,
      isEnabled:
        !!bounty?.id &&
        bounty.isPublished &&
        !bounty.isWinnersAnnounced &&
        !bounty.isExpired,
    }),
  );

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery(
    submissionsQuery({
      slug,
      searchText,
      skip,
      length,
      sponsorId: user?.currentSponsorId!,
    }),
  );

  const queryClient = useQueryClient();

  const updateBountyData = (updater: (old: any) => any) => {
    queryClient.setQueryData(['bounty', slug], updater);
  };

  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (searchText) {
      length = 999;
      if (skip !== 0) {
        setSkip(0);
      }
    } else {
      length = 10;
    }
  }, [searchText]);

  useEffect(() => {
    if (searchParams.has('scout')) posthog.capture('scout tab_scout');
  }, []);

  const isSponsorVerified = bounty?.sponsor?.isVerified;

  return (
    <SponsorLayout>
      {isListingLoading ? (
        <LoadingSection />
      ) : (
        <>
          {isOpen && (
            <PublishResults
              isOpen={isOpen}
              onClose={onClose}
              totalWinners={bounty.totalWinners}
              totalPaymentsMade={bounty.totalPaymentsMade}
              bounty={bounty}
            />
          )}
          <SubmissionHeader bounty={bounty} onOpen={onOpen} />
          <Tabs defaultIndex={searchParams.has('scout') ? 1 : 0}>
            <TabList
              gap={4}
              color="brand.slate.400"
              fontWeight={500}
              borderBottomWidth={'1px'}
            >
              <Tab px={1} fontSize="sm" _selected={selectedStyles}>
                Submissions
              </Tab>
              {bounty?.isPublished &&
                !bounty?.isWinnersAnnounced &&
                !bounty.isExpired && (
                  <Tooltip
                    px={4}
                    py={2}
                    color="brand.slate.500"
                    fontFamily={'var(--font-sans)'}
                    bg="white"
                    borderRadius={'lg'}
                    isDisabled={isSponsorVerified === true}
                    label="Scout is an invite-only feature right now"
                  >
                    <Tab
                      className="ph-no-capture"
                      px={1}
                      fontSize="sm"
                      _disabled={{ color: 'brand.slate.400' }}
                      _selected={selectedStyles}
                      cursor={isSponsorVerified ? 'pointer' : 'not-allowed'}
                      isDisabled={!isSponsorVerified}
                      onClick={() => posthog.capture('scout tab_scout')}
                    >
                      Scout Talent
                      {!!isSponsorVerified && (
                        <Box w={1.5} h={1.5} ml={1.5} bg="red" rounded="full" />
                      )}
                    </Tab>
                  </Tooltip>
                )}
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                {!submissions?.length &&
                !searchText &&
                !isSubmissionsLoading ? (
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
                      People are working!
                    </Text>
                    <Text
                      mx="auto"
                      mb={200}
                      color={'brand.slate.400'}
                      fontWeight={500}
                      textAlign={'center'}
                    >
                      Submissions will start appearing here
                    </Text>
                  </>
                ) : (
                  <>
                    <Flex align={'start'} bg="white">
                      <Flex flex="4 1 auto" minH="600px">
                        <SubmissionList
                          submissions={submissions!}
                          setSearchText={setSearchText}
                          selectedSubmission={selectedSubmission}
                          setSelectedSubmission={setSelectedSubmission}
                          type={bounty?.type}
                        />
                        <SubmissionDetails
                          bounty={bounty}
                          submissions={submissions!}
                          setSubmissions={(newSubmissions) => {
                            queryClient.setQueryData(
                              ['submissions', slug, searchText, skip, length],
                              newSubmissions,
                            );
                          }}
                          selectedSubmission={selectedSubmission}
                          setSelectedSubmission={setSelectedSubmission}
                          updateBountyData={updateBountyData}
                        />
                      </Flex>
                    </Flex>
                    <Flex align="center" justify="start" gap={4} mt={4}>
                      {!!searchText ? (
                        <Text color="brand.slate.400" fontSize="sm">
                          Found{' '}
                          <Text as="span" fontWeight={700}>
                            {submissions?.length}
                          </Text>{' '}
                          {submissions?.length === 1 ? 'result' : 'results'}
                        </Text>
                      ) : (
                        <>
                          <Button
                            isDisabled={skip <= 0}
                            leftIcon={<ChevronLeftIcon w={5} h={5} />}
                            onClick={() => setSkip(Math.max(0, skip - length))}
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
                              {Math.min(
                                skip + length,
                                bounty?.totalSubmissions || 0,
                              )}
                            </Text>{' '}
                            of{' '}
                            <Text as="span" fontWeight={700}>
                              {bounty?.totalSubmissions}
                            </Text>{' '}
                            Submissions
                          </Text>
                          <Button
                            isDisabled={
                              bounty?.totalSubmissions
                                ? bounty.totalSubmissions <= skip + length
                                : true
                            }
                            onClick={() => setSkip(skip + length)}
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
              {bounty &&
                bounty.id &&
                bounty.isPublished &&
                !bounty.isWinnersAnnounced &&
                !bounty.isExpired && (
                  <TabPanel px={0}>
                    <ScoutTable
                      bountyId={bounty.id}
                      scouts={scouts || []}
                      setInvited={(userId: string) => {
                        queryClient.setQueryData(
                          ['scouts', bounty.id],
                          (oldData: ScoutRowType[] | undefined) => {
                            if (!oldData) return oldData;
                            return oldData.map((scout) =>
                              scout.userId === userId
                                ? { ...scout, invited: true }
                                : scout,
                            );
                          },
                        );
                      }}
                    />
                  </TabPanel>
                )}
            </TabPanels>
          </Tabs>
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

export default BountySubmissions;
