import {
  ArrowForwardIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Circle,
  CircularProgress,
  Flex,
  Image,
  Link,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { GrantApplicationStatus } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import React, { type Dispatch, type SetStateAction } from 'react';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';
import { toast } from 'sonner';

import { tokenList } from '@/constants';
import { type Grant } from '@/features/grants';
import {
  Discord,
  EarnAvatar,
  extractTelegramUsername,
  extractTwitterUsername,
  Telegram,
  Twitter,
} from '@/features/talent';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import { type GrantApplicationWithUser } from '../../types';
import { InfoBox } from '../InfoBox';
import { MarkCompleted } from './MarkCompleted';
import { ApproveModal } from './Modals/ApproveModal';
import { RejectGrantApplicationModal } from './Modals/RejectModal';
import { RecordPaymentButton } from './RecordPaymentButton';

interface Props {
  grant: Grant | undefined;
  applications: GrantApplicationWithUser[] | undefined;
  selectedApplication: GrantApplicationWithUser | undefined;
  setSelectedApplication: Dispatch<
    SetStateAction<GrantApplicationWithUser | undefined>
  >;
  isMultiSelectOn: boolean;
  params: {
    searchText: string;
    length: number;
    skip: number;
  };
}
export const ApplicationDetails = ({
  grant,
  applications,
  selectedApplication,
  setSelectedApplication,
  isMultiSelectOn,
  params,
}: Props) => {
  const isPending = selectedApplication?.applicationStatus === 'Pending';
  const isApproved = selectedApplication?.applicationStatus === 'Approved';
  const isRejected = selectedApplication?.applicationStatus === 'Rejected';

  const isNativeAndNonST = !grant?.airtableId && grant?.isNative;

  const queryClient = useQueryClient();

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

  const tokenIcon = tokenList.find(
    (ele) => ele.tokenSymbol === grant?.token,
  )?.icon;

  const formattedCreatedAt = dayjs(selectedApplication?.createdAt).format(
    'DD MMM YYYY',
  );

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

  const updateApplicationState = (
    updatedApplication: GrantApplicationWithUser,
  ) => {
    setSelectedApplication(updatedApplication);

    queryClient.setQueryData<GrantApplicationWithUser[]>(
      ['sponsor-applications', grant?.slug, params],
      (oldData) =>
        oldData?.map((application) =>
          application.id === updatedApplication.id
            ? updatedApplication
            : application,
        ),
    );
  };

  const approveGrantMutation = useMutation({
    mutationFn: async ({
      applicationId,
      approvedAmount,
    }: {
      applicationId: string;
      approvedAmount: number;
    }) => {
      const response = await axios.post(
        '/api/sponsor-dashboard/grants/update-application-status',
        {
          data: [{ id: applicationId, approvedAmount }],
          applicationStatus: 'Approved',
        },
      );
      return response.data;
    },
    onMutate: async ({ applicationId, approvedAmount }) => {
      const previousApplications = queryClient.getQueryData<
        GrantApplicationWithUser[]
      >(['sponsor-applications', grant?.slug, params]);

      queryClient.setQueryData<GrantApplicationWithUser[]>(
        ['sponsor-applications', grant?.slug, params],
        (oldData) => {
          if (!oldData) return oldData;
          const updatedApplications = oldData.map((application) =>
            application.id === applicationId
              ? {
                ...application,
                applicationStatus: GrantApplicationStatus.Approved,
                approvedAmount: approvedAmount,
              }
              : application,
          );
          const updatedApplication = updatedApplications.find(
            (application) => application.id === applicationId,
          );
          setSelectedApplication(updatedApplication);
          moveToNextPendingApplication();
          return updatedApplications;
        },
      );

      return { previousApplications };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ['sponsor-applications', grant?.slug, params],
        context?.previousApplications,
      );
      toast.error('失败，请重试');
    },
  });

  const rejectGrantMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await axios.post(
        '/api/sponsor-dashboard/grants/update-application-status',
        {
          data: [{ id: applicationId }],
          applicationStatus: 'Rejected',
        },
      );
      return response.data;
    },
    onMutate: async (applicationId) => {
      const previousApplications = queryClient.getQueryData<
        GrantApplicationWithUser[]
      >(['sponsor-applications', grant?.slug, params]);

      queryClient.setQueryData<GrantApplicationWithUser[]>(
        ['sponsor-applications', grant?.slug, params],
        (oldData) => {
          if (!oldData) return oldData;
          const updatedApplications = oldData.map((application) =>
            application.id === applicationId
              ? {
                ...application,
                applicationStatus: GrantApplicationStatus.Rejected,
              }
              : application,
          );
          const updatedApplication = updatedApplications.find(
            (application) => application.id === applicationId,
          );
          setSelectedApplication(updatedApplication);
          moveToNextPendingApplication();
          return updatedApplications;
        },
      );

      return { previousApplications };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ['sponsor-applications', grant?.slug, params],
        context?.previousApplications,
      );
      toast.error('失败，请重试');
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

  const SocialMediaLink = () => {
    if (selectedApplication?.user?.telegram) {
      const username =
        extractTelegramUsername(selectedApplication.user.telegram) || null;
      const link = selectedApplication.user.telegram;
      return (
        <Flex align="center" justify="start" gap={2} fontSize="sm">
          <Telegram link={link} color="#94A3B8" />
          <Link color="brand.slate.400" href={link} isExternal>
            @{username}
          </Link>
        </Flex>
      );
    }

    if (selectedApplication?.user?.twitter) {
      const username =
        extractTwitterUsername(selectedApplication.user.twitter) || null;
      const link = selectedApplication.user.twitter;
      return (
        <Flex align="center" justify="start" gap={2} fontSize="sm">
          <Twitter link={link} color="#94A3B8" />
          <Link color="brand.slate.400" href={link} isExternal>
            @{username}
          </Link>
        </Flex>
      );
    }

    if (selectedApplication?.user?.discord) {
      return (
        <Flex align="center" justify="start" gap={2} fontSize="sm">
          <Discord link={selectedApplication.user.discord} color="#94A3B8" />
          <Text color="brand.slate.400">
            {selectedApplication.user.discord}
          </Text>
        </Flex>
      );
    }

    return null;
  };

  return (
    <Box w="100%" bg="white" roundedRight={'xl'}>
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

      {applications?.length ? (
        <>
          <Box
            pos="sticky"
            top={'3rem'}
            py={1}
            borderBottom={'1px'}
            borderBottomColor={'brand.slate.200'}
            bgColor={'white'}
          >
            <Flex
              align="center"
              justify={'space-between'}
              w="full"
              px={4}
              py={3}
            >
              <Flex align="center" gap={2} w="full">
                <EarnAvatar
                  size="40px"
                  id={selectedApplication?.user?.id}
                  avatar={selectedApplication?.user?.photo || undefined}
                />
                <Box>
                  <Text
                    w="100%"
                    color="brand.slate.900"
                    fontSize="md"
                    fontWeight={500}
                    whiteSpace={'nowrap'}
                  >
                    {`${selectedApplication?.user?.firstName}'s Application`}
                  </Text>
                  <Link
                    as={NextLink}
                    w="100%"
                    color="brand.purple"
                    fontSize="xs"
                    fontWeight={500}
                    whiteSpace={'nowrap'}
                    href={`/t/${selectedApplication?.user?.username}`}
                    isExternal
                  >
                    查看个人档案
                    <ArrowForwardIcon mb="0.5" />
                  </Link>
                </Box>
              </Flex>
              <Flex
                className="ph-no-capture"
                align="center"
                justify={'flex-end'}
                gap={2}
                w="full"
              >
                {isPending && (
                  <>
                    <Button
                      color="#079669"
                      bg="#ECFEF6"
                      _hover={{ bg: '#D1FAE5' }}
                      isDisabled={isMultiSelectOn}
                      leftIcon={
                        <Circle p={'5px'} bg="#079669">
                          <CheckIcon color="white" boxSize="2.5" />
                        </Circle>
                      }
                      onClick={approveOnOpen}
                    >
                      Approve
                    </Button>
                    <Button
                      color="#E11D48"
                      bg="#FEF2F2"
                      _hover={{ bg: '#FED7D7' }}
                      isDisabled={isMultiSelectOn}
                      leftIcon={
                        <Circle p={'5px'} bg="#E11D48">
                          <CloseIcon color="white" boxSize="2" />
                        </Circle>
                      }
                      onClick={rejectedOnOpen}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {isApproved && (
                  <>
                    <MarkCompleted
                      isCompleted={
                        selectedApplication.applicationStatus === 'Completed'
                      }
                      applicationId={selectedApplication.id}
                      onMarkCompleted={updateApplicationState}
                    />
                    {isNativeAndNonST &&
                      selectedApplication.totalPaid !==
                      selectedApplication.approvedAmount && (
                        <RecordPaymentButton
                          applicationId={selectedApplication.id}
                          approvedAmount={selectedApplication.approvedAmount}
                          totalPaid={selectedApplication.totalPaid}
                          token={grant.token || 'USDC'}
                          onPaymentRecorded={updateApplicationState}
                        />
                      )}
                    <Button
                      color="#079669"
                      bg="#ECFEF6"
                      _disabled={{
                        opacity: 1,
                      }}
                      pointerEvents={'none'}
                      isDisabled={true}
                      leftIcon={
                        <Circle p={'5px'} bg="#079669">
                          <CheckIcon color="white" boxSize="2.5" />
                        </Circle>
                      }
                    >
                      Approved
                    </Button>
                  </>
                )}
                {isRejected && (
                  <>
                    <Button
                      color="#E11D48"
                      bg="#FEF2F2"
                      _disabled={{
                        opacity: 1,
                      }}
                      pointerEvents={'none'}
                      isDisabled={true}
                      leftIcon={
                        <Circle p={'5px'} bg="#E11D48">
                          <CloseIcon color="white" boxSize="2" />
                        </Circle>
                      }
                    >
                      Rejected
                    </Button>
                  </>
                )}
              </Flex>
            </Flex>

            <Flex align="center" gap={5} px={4} py={2}>
              {isApproved && (
                <Flex align="center">
                  <Text
                    mr={3}
                    color="brand.slate.400"
                    fontSize={'sm'}
                    fontWeight={600}
                    whiteSpace={'nowrap'}
                  >
                    批准
                  </Text>

                  <Image
                    w={4}
                    h={4}
                    mr={0.5}
                    alt={'token'}
                    rounded={'full'}
                    src={tokenIcon}
                  />
                  <Text
                    color="brand.slate.600"
                    fontSize={'sm'}
                    fontWeight={600}
                    whiteSpace={'nowrap'}
                  >
                    {`${selectedApplication?.approvedAmount?.toLocaleString()}`}
                    <Text as="span" ml={0.5} color="brand.slate.400">
                      {grant?.token}
                    </Text>
                  </Text>
                  {isApproved && (
                    <Flex mr={4} ml={3}>
                      <CircularProgress
                        color="brand.purple"
                        size="20px"
                        thickness={'12px'}
                        value={Number(
                          (
                            (selectedApplication.totalPaid /
                              selectedApplication.approvedAmount) *
                            100
                          ).toFixed(2),
                        )}
                      />
                      <Text
                        ml={1}
                        color="brand.slate.600"
                        fontSize={'sm'}
                        fontWeight={500}
                        whiteSpace={'nowrap'}
                      >
                        {Number(
                          (
                            (selectedApplication.totalPaid /
                              selectedApplication.approvedAmount) *
                            100
                          ).toFixed(2),
                        )}
                        %{' '}
                        <Text as="span" color="brand.slate.400">
                          已支付
                        </Text>
                      </Text>
                    </Flex>
                  )}
                </Flex>
              )}
              {selectedApplication?.user?.email && (
                <Flex align="center" justify="start" gap={2} fontSize="sm">
                  <MdOutlineMail color="#94A3B8" />
                  <Link
                    color="brand.slate.400"
                    href={`mailto:${selectedApplication.user.email}`}
                    isExternal
                  >
                    {truncateString(selectedApplication?.user?.email, 36)}
                  </Link>
                </Flex>
              )}
              {selectedApplication?.user?.publicKey && (
                <Flex
                  align="center"
                  justify="start"
                  gap={2}
                  fontSize="sm"
                  whiteSpace={'nowrap'}
                >
                  <MdOutlineAccountBalanceWallet color="#94A3B8" />
                  <Text color="brand.slate.400">
                    {truncatePublicKey(selectedApplication?.user?.publicKey, 3)}
                    <Tooltip label="Copy Wallet ID" placement="right">
                      <CopyIcon
                        cursor="pointer"
                        ml={1}
                        color="brand.slate.400"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            selectedApplication?.user?.publicKey || '',
                          )
                        }
                      />
                    </Tooltip>
                  </Text>
                </Flex>
              )}

              <SocialMediaLink />
            </Flex>
          </Box>

          <Box
            overflowY={'scroll'}
            w="100%"
            maxW="60rem"
            h={'67.15rem'}
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#e2e8f0',
                borderRadius: '24px',
              },
            }}
          >
            <Box w="full" px={4} py={5}>
              <Box mb={4}>
                <Text
                  mb={1}
                  color="brand.slate.400"
                  fontSize="xs"
                  fontWeight={600}
                  textTransform={'uppercase'}
                >
                  提问
                </Text>
                <Flex align={'center'} gap={0.5}>
                  <Image
                    w={4}
                    h={4}
                    mr={0.5}
                    alt={'token'}
                    rounded={'full'}
                    src={tokenIcon}
                  />
                  <Text
                    color="brand.slate.600"
                    fontSize={'sm'}
                    fontWeight={600}
                    whiteSpace={'nowrap'}
                  >
                    {`${selectedApplication?.ask?.toLocaleString()}`}
                    <Text as="span" ml={0.5} color="brand.slate.400">
                      {grant?.token}
                    </Text>
                  </Text>
                </Flex>
              </Box>

              <Box mb={4}>
                <Text
                  mb={1}
                  color="brand.slate.400"
                  fontSize="xs"
                  fontWeight={600}
                  textTransform={'uppercase'}
                >
                  申请日期
                </Text>

                <Text
                  color="brand.slate.600"
                  fontSize={'sm'}
                  fontWeight={500}
                  whiteSpace={'nowrap'}
                >
                  {formattedCreatedAt}
                </Text>
              </Box>

              <InfoBox
                label="Project Title"
                content={selectedApplication?.projectTitle}
              />
              <InfoBox
                label="One-Liner Description"
                content={selectedApplication?.projectOneLiner}
              />
              <InfoBox
                label="Project Details"
                content={selectedApplication?.projectDetails}
                isHtml
              />
              <InfoBox label="Twitter" content={selectedApplication?.twitter} />
              <InfoBox
                label="Deadline"
                content={selectedApplication?.projectTimeline}
              />
              <InfoBox
                label="Proof of Work"
                content={selectedApplication?.proofOfWork}
                isHtml
              />
              <InfoBox
                label="Goals and Milestones"
                content={selectedApplication?.milestones}
                isHtml
              />
              <InfoBox
                label="Primary Key Performance Indicator"
                content={selectedApplication?.kpi}
                isHtml
              />
              {Array.isArray(selectedApplication?.answers) &&
                selectedApplication.answers.map(
                  (answer: any, answerIndex: number) => (
                    <InfoBox
                      key={answerIndex}
                      label={answer.question}
                      content={answer.answer}
                      isHtml
                    />
                  ),
                )}
            </Box>
          </Box>
        </>
      ) : (
        <Box p={3}>
          <Text color={'brand.slate.500'} fontSize={'xl'} fontWeight={500}>
            没找到
          </Text>
          <Text color={'brand.slate.400'} fontSize={'sm'}>
            尝试搜索不同的关键词
          </Text>
        </Box>
      )}
    </Box>
  );
};
