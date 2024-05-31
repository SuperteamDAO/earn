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
  Flex,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  TagLabel,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { type SubmissionLabels } from '@prisma/client';
import axios from 'axios';
import NextLink from 'next/link';
import React, { type Dispatch, type SetStateAction } from 'react';
import { BsTwitterX } from 'react-icons/bs';
import {
  MdArrowDropDown,
  MdOutlineAccountBalanceWallet,
  MdOutlineMail,
} from 'react-icons/md';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import { type Grant } from '@/features/grants';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import { labelMenuOptions } from '../../constants';
import { type GrantApplicationWithUser } from '../../types';
import { colorMap } from '../../utils';
import { ApproveModal } from './Modals/ApproveModal';
import { RejectModal } from './Modals/RejectModal';

interface Props {
  grant: Grant | null;
  applications: GrantApplicationWithUser[];
  setApplications: Dispatch<SetStateAction<GrantApplicationWithUser[]>>;
  selectedApplication: GrantApplicationWithUser | undefined;
  setSelectedApplication: Dispatch<
    SetStateAction<GrantApplicationWithUser | undefined>
  >;
}

const InfoBox = ({
  label,
  content,
}: {
  label: string;
  content?: string | null;
}) => (
  <Box mb={4}>
    <Text
      mb={1}
      color="brand.slate.400"
      fontSize="xs"
      fontWeight={600}
      textTransform={'uppercase'}
    >
      {label}
    </Text>
    <Text color="brand.slate.700" wordBreak={'break-all'}>
      {content ? content : '-'}
    </Text>
  </Box>
);

export const ApplicationDetails = ({
  grant,
  applications,
  setApplications,
  selectedApplication,
  setSelectedApplication,
}: Props) => {
  const selectLabel = async (
    label: SubmissionLabels,
    id: string | undefined,
  ) => {
    try {
      await axios.post(`/api/grantApplication/updateLabel/`, {
        label,
        id,
      });
      const applicationIndex = applications.findIndex((s) => s.id === id);
      if (applicationIndex >= 0) {
        const updatedApplication: GrantApplicationWithUser = {
          ...(applications[applicationIndex] as GrantApplicationWithUser),
          label,
        };
        const newApplications = [...applications];
        newApplications[applicationIndex] = updatedApplication;
        setApplications(newApplications);
        setSelectedApplication(updatedApplication);
      }
    } catch (e) {
      console.log(e);
    }
  };

  let bg, color;

  if (applications.length > 0) {
    ({ bg, color } = colorMap[selectedApplication?.label as SubmissionLabels]);
  }

  const isPending = selectedApplication?.applicationStatus === 'Pending';
  const isApproved = selectedApplication?.applicationStatus === 'Approved';

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

  return (
    <Box
      w="150%"
      p={1.5}
      bg="white"
      borderColor="brand.slate.200"
      borderTopWidth="1px"
      borderRightWidth={'1px'}
      borderBottomWidth="1px"
      roundedRight={'xl'}
    >
      <RejectModal
        applicationId={selectedApplication?.id}
        rejectIsOpen={rejectedIsOpen}
        rejectOnClose={rejectedOnClose}
        ask={selectedApplication?.ask}
        granteeName={selectedApplication?.user?.firstName}
      />

      <ApproveModal
        applicationId={selectedApplication?.id}
        approveIsOpen={approveIsOpen}
        approveOnClose={approveOnClose}
        ask={selectedApplication?.ask}
        granteeName={selectedApplication?.user?.firstName}
      />

      {applications.length ? (
        <>
          <Flex align="center" justify={'space-between'} w="full" px={4} py={3}>
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
                >
                  View Profile <ArrowForwardIcon mb="0.5" />
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
                  <Menu>
                    <MenuButton
                      as={Button}
                      color="brand.slate.500"
                      fontWeight={500}
                      textTransform="capitalize"
                      bg="transparent"
                      borderWidth={'1px'}
                      borderColor="brand.slate.300"
                      _hover={{ backgroundColor: 'transparent' }}
                      _active={{
                        backgroundColor: 'transparent',
                        borderWidth: '1px',
                      }}
                      _expanded={{ borderColor: 'brand.purple' }}
                      pointerEvents={isPending ? 'all' : 'none'}
                      isDisabled={!isPending}
                      rightIcon={<MdArrowDropDown />}
                    >
                      <Tag px={3} py={1} bg={bg} rounded="full">
                        <TagLabel
                          w="full"
                          color={color}
                          fontSize={'13px'}
                          textAlign={'center'}
                          textTransform={'capitalize'}
                          whiteSpace={'nowrap'}
                        >
                          {selectedApplication?.label || 'Select Option'}
                        </TagLabel>
                      </Tag>
                    </MenuButton>
                    <MenuList borderColor="brand.slate.300">
                      {labelMenuOptions.map((option) => (
                        <MenuItem
                          key={option.value}
                          _focus={{ bg: 'brand.slate.100' }}
                          onClick={() =>
                            selectLabel(
                              option.value as SubmissionLabels,
                              selectedApplication?.id,
                            )
                          }
                        >
                          <Tag px={3} py={1} bg={option.bg} rounded="full">
                            <TagLabel
                              w="full"
                              color={option.color}
                              fontSize={'11px'}
                              textAlign={'center'}
                              textTransform={'capitalize'}
                              whiteSpace={'nowrap'}
                            >
                              {option.label}
                            </TagLabel>
                          </Tag>
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                  <Button
                    color="#079669"
                    bg="#ECFEF6"
                    _hover={{ bg: '#D1FAE5' }}
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

              {isApproved && <Button>Record Payment</Button>}
            </Flex>
          </Flex>

          <Flex align="center" gap={5} px={5} py={2}>
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
            {selectedApplication?.user?.twitter && (
              <Flex align="center" justify="start" gap={2} fontSize="sm">
                <BsTwitterX color="#94A3B8" />

                <Link
                  color="brand.slate.400"
                  href={getURLSanitized(
                    selectedApplication?.user?.twitter?.replace(
                      'twitter.com',
                      'x.com',
                    ) || '#',
                  )}
                  isExternal
                >
                  {truncateString(
                    selectedApplication?.user?.twitter?.replace(
                      'twitter.com',
                      'x.com',
                    ) || '-',
                    36,
                  )}
                </Link>
              </Flex>
            )}
          </Flex>

          <Box w="full" px={4} py={5}>
            <InfoBox
              label="Project Title"
              content={selectedApplication?.projectTitle}
            />
            <InfoBox
              label="One-Liner Description"
              content={selectedApplication?.projectOneLiner}
            />
            <InfoBox
              label="Ask"
              content={`${selectedApplication?.ask?.toLocaleString()} ${grant?.token}`}
            />
            <InfoBox
              label="Project Details"
              content={selectedApplication?.projectDetails}
            />
            <InfoBox
              label="Deadline"
              content={selectedApplication?.projectTimeline}
            />
            <InfoBox
              label="Proof of Work"
              content={selectedApplication?.proofOfWork}
            />
            <InfoBox
              label="Goals and Milestones"
              content={selectedApplication?.milestones}
            />
            <InfoBox
              label="Primary Key Performance Indicator"
              content={selectedApplication?.kpi}
            />
          </Box>
        </>
      ) : (
        <></>
      )}
    </Box>
  );
};
