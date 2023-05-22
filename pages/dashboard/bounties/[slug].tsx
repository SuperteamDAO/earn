import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  LinkIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import Avatar from 'boring-avatars';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import ErrorSection from '@/components/shared/ErrorSection';
import LoadingSection from '@/components/shared/LoadingSection';
import type { Bounty } from '@/interface/bounty';
import type { SubmissionWithUser } from '@/interface/submission';
import Sidebar from '@/layouts/Sidebar';
import { userStore } from '@/store/user';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

interface Props {
  slug: string;
}

function BountySubmissions({ slug }: Props) {
  const router = useRouter();
  const { userInfo } = userStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [user, setUser] = useState<any>(null);
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [rewards, setRewards] = useState<string[]>([]);
  const [isBountyLoading, setIsBountyLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const length = 15;

  const getSubmissions = async (id?: string) => {
    setIsBountyLoading(true);
    try {
      const submissionsDetails = await axios.get(
        `/api/submission/${id || bounty?.id}/`,
        {
          params: {
            skip,
            take: length,
          },
        }
      );
      setTotalSubmissions(submissionsDetails.data.total);
      setSubmissions(submissionsDetails.data.data);
      setIsBountyLoading(false);
    } catch (e) {
      setIsBountyLoading(false);
    }
  };

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${slug}/`);
      setBounty(bountyDetails.data);
      if (bountyDetails.data.sponsorId !== userInfo?.currentSponsorId) {
        router.push('/dashboard/bounties');
      }
      getSubmissions(bountyDetails.data.id);
      setRewards(Object.keys(bountyDetails.data.rewards || {}));
    } catch (e) {
      setIsBountyLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getBounty();
    }
  }, [userInfo?.currentSponsorId]);

  useEffect(() => {
    if (userInfo?.currentSponsorId && !isBountyLoading) {
      getSubmissions();
    }
  }, [skip]);

  const bountyStatus =
    // eslint-disable-next-line no-nested-ternary
    bounty?.status === 'OPEN'
      ? bounty?.isPublished
        ? 'PUBLISHED'
        : 'DRAFT'
      : 'CLOSED';

  const getBgColor = (status: String) => {
    switch (status) {
      case 'PUBLISHED':
        return 'green';
      case 'DRAFT':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const selectWinner = async (position: string, id: string) => {
    try {
      await axios.post(`/api/submission/update/`, {
        id,
        isWinner: !!position,
        winnerPosition: position || null,
      });
    } catch (e) {
      console.log('file: [slug].tsx:136 ~ selectWinner ~ e:', e);
    }
  };

  const exportSubmissionsCsv = async () => {
    setIsExporting(true);
    try {
      const exportURL = await axios.get(
        `/api/submission/${bounty?.id}/export/`
      );
      const url = exportURL?.data?.url || '';
      window.open(url, '_blank');
      setIsExporting(false);
    } catch (e) {
      setIsExporting(false);
    }
  };

  return (
    <Sidebar>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" bg="transparent">
              {user?.photo ? (
                <Image
                  boxSize="32px"
                  borderRadius="full"
                  alt={`${user?.firstName} ${user?.lastName}`}
                  src={user?.photo}
                />
              ) : (
                <Avatar
                  name={`${user?.firstName} ${user?.lastName}`}
                  colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                  size={32}
                  variant="marble"
                />
              )}
              <Box display={{ base: 'none', md: 'block' }} ml={2}>
                <Text color="brand.slate.800" fontSize="sm">
                  {`${user?.firstName} ${user?.lastName}`}
                </Text>
                <Text color="brand.slate.500" fontSize="xs" fontWeight={400}>
                  {user?.email}
                </Text>
              </Box>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex align="start" justify="start" gap={2} mb={4}>
              <Text w={20} color="brand.slate.400">
                Bio:
              </Text>
              <Text color="brand.purple">{user?.bio || '-'}</Text>
            </Flex>
            <Flex align="center" justify="start" gap={2} mb={4}>
              <Text w={20} color="brand.slate.400">
                Wallet:
              </Text>
              <Text color="brand.purple">
                {truncatePublicKey(user?.publicKey)}
                <Tooltip label="Copy Wallet ID" placement="right">
                  <CopyIcon
                    cursor="pointer"
                    ml={1}
                    onClick={() =>
                      navigator.clipboard.writeText(user?.publicKey)
                    }
                  />
                </Tooltip>
              </Text>
            </Flex>
            <Flex align="center" justify="start" gap={2} mb={4}>
              <Text w={20} color="brand.slate.400">
                Discord:
              </Text>
              <Text color="brand.purple">{user?.discord || '-'}</Text>
            </Flex>
            <Flex align="center" justify="start" gap={2} mb={4}>
              <Text w={20} color="brand.slate.400">
                Twitter:
              </Text>
              <Link color="brand.purple" href={user?.twitter} isExternal>
                {user?.twitter || '-'}
              </Link>
            </Flex>
            <Flex align="center" justify="start" gap={2} mb={4}>
              <Text w={20} color="brand.slate.400">
                LinkedIn:
              </Text>
              <Link color="brand.purple" href={user?.linkedin} isExternal>
                {user?.linkedin
                  ? `${user?.linkedin?.slice(0, 25)}${
                      user?.linkedin?.length >= 25 && '...'
                    }` || '-'
                  : '-'}
              </Link>
            </Flex>
            <Flex align="center" justify="start" gap={2} mb={4}>
              <Text w={20} color="brand.slate.400">
                GitHub:
              </Text>
              <Link color="brand.purple" href={user?.github} isExternal>
                {user?.github || '-'}
              </Link>
            </Flex>
            <Flex align="center" justify="start" gap={2} mb={4}>
              <Text w={20} color="brand.slate.400">
                Website:
              </Text>
              <Link color="brand.purple" href={user?.website} isExternal>
                {user?.website || '-'}
              </Link>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button
              onClick={() => {
                onClose();
                setUser(null);
              }}
              variant="solid"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {isBountyLoading ? (
        <LoadingSection />
      ) : (
        <>
          <Box mb={4}>
            <Breadcrumb color="brand.slate.400">
              <BreadcrumbItem>
                <NextLink href="/dashboard/bounties" passHref>
                  <BreadcrumbLink color="brand.slate.400">
                    <Flex align="center">
                      <ChevronLeftIcon mr={1} w={6} h={6} />
                      Bounties
                    </Flex>
                  </BreadcrumbLink>
                </NextLink>
              </BreadcrumbItem>

              <BreadcrumbItem>
                <Text color="brand.slate.400">Submissions</Text>
              </BreadcrumbItem>
            </Breadcrumb>
          </Box>
          <Flex justify="space-between" mb={4}>
            <Text color="brand.slate.500" fontSize="lg" fontWeight="700">
              {bounty?.title}
            </Text>
            <Tag color={'white'} bg={getBgColor(bountyStatus)} variant="solid">
              {bountyStatus}
            </Tag>
          </Flex>
          <Flex align="center" justify="space-between" mb={6}>
            <Text color="brand.slate.500">
              {totalSubmissions}{' '}
              <Text as="span" color="brand.slate.400">
                Submissions
              </Text>
            </Text>
            <Button
              isLoading={isExporting}
              loadingText={'Exporting...'}
              onClick={() => exportSubmissionsCsv()}
              variant={'solid'}
            >
              Export Submissions CSV
            </Button>
          </Flex>
          {!submissions?.length ? (
            <ErrorSection
              title="No submissions found!"
              message="View your bounty submissions here once they are submitted"
            />
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr bg="brand.slate.100">
                    <Th
                      color="brand.slate.400"
                      fontSize="sm"
                      fontWeight={500}
                      textTransform={'capitalize'}
                    >
                      User
                    </Th>
                    <Th
                      pl={0}
                      color="brand.slate.400"
                      fontSize="sm"
                      fontWeight={500}
                      textAlign="center"
                      textTransform={'capitalize'}
                    >
                      Type
                    </Th>
                    <Th
                      pl={0}
                      color="brand.slate.400"
                      fontSize="sm"
                      fontWeight={500}
                      textTransform={'capitalize'}
                    >
                      Link
                    </Th>
                    <Th
                      pl={0}
                      color="brand.slate.400"
                      fontSize="sm"
                      fontWeight={500}
                      textTransform={'capitalize'}
                    >
                      Tweet
                    </Th>
                    <Th
                      pl={0}
                      color="brand.slate.400"
                      fontSize="sm"
                      fontWeight={500}
                      textTransform={'capitalize'}
                    >
                      Winner
                    </Th>
                    <Th
                      pl={0}
                      color="brand.slate.400"
                      fontSize="sm"
                      fontWeight={500}
                      textTransform={'capitalize'}
                    >
                      Payment
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {submissions.map((submission) => {
                    return (
                      <Tr key={submission?.id} bg="white">
                        <Td>
                          <Flex
                            align="center"
                            p={1}
                            bg="transparent"
                            borderRadius="md"
                            _hover={{
                              backgroundColor: 'brand.slate.100',
                            }}
                            cursor="pointer"
                            onClick={() => {
                              setUser(submission?.user);
                              onOpen();
                            }}
                          >
                            {submission?.user?.photo ? (
                              <Image
                                boxSize="32px"
                                borderRadius="full"
                                alt={`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                                src={submission?.user?.photo}
                              />
                            ) : (
                              <Avatar
                                name={`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                                colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                                size={32}
                                variant="marble"
                              />
                            )}
                            <Box display={{ base: 'none', md: 'block' }} ml={2}>
                              <Text color="brand.slate.800" fontSize="sm">
                                {`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                              </Text>
                              <Text color="brand.slate.500" fontSize="xs">
                                {submission?.user?.email}
                              </Text>
                            </Box>
                          </Flex>
                        </Td>
                        <Td textAlign="center">
                          <Tag textTransform={'uppercase'}>
                            {submission?.user?.superteamLevel || '-'}
                          </Tag>
                        </Td>
                        <Td pl={0} textAlign="center">
                          <Link
                            color="brand.purple"
                            href={submission?.link || '#'}
                            isExternal
                          >
                            {submission?.link && (
                              <LinkIcon w={3} h={3} mr={1} />
                            )}
                            {submission?.link && submission?.link?.length >= 20
                              ? `${submission?.link?.slice(0, 20)}...`
                              : submission?.link || '-'}
                          </Link>
                        </Td>
                        <Td pl={0} textAlign="center">
                          <Link
                            color="brand.purple"
                            href={submission?.tweet || '#'}
                            isExternal
                          >
                            {submission?.tweet && (
                              <LinkIcon w={3} h={3} mr={1} />
                            )}
                            {submission?.tweet &&
                            submission?.tweet?.length >= 20
                              ? `${submission?.tweet?.slice(0, 20)}...`
                              : submission?.tweet || '-'}
                          </Link>
                        </Td>
                        <Td>
                          <Select
                            defaultValue={
                              submission?.isWinner
                                ? submission?.winnerPosition || ''
                                : ''
                            }
                            onChange={(e) =>
                              selectWinner(e.target.value, submission?.id)
                            }
                          >
                            <option value={''}>Select Winner</option>
                            {rewards.map((reward) => (
                              <option key={reward} value={reward}>
                                {reward}
                              </option>
                            ))}
                          </Select>
                        </Td>
                        <Td>
                          <Tag>-</Tag>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          )}
          <Flex align="center" justify="end" mt={6}>
            <Text mr={4} color="brand.slate.400" fontSize="sm">
              <Text as="span" fontWeight={700}>
                {skip + 1}
              </Text>{' '}
              -{' '}
              <Text as="span" fontWeight={700}>
                {Math.min(skip + length, totalSubmissions)}
              </Text>{' '}
              of{' '}
              <Text as="span" fontWeight={700}>
                {totalSubmissions}
              </Text>{' '}
              Bounties
            </Text>
            <Button
              mr={4}
              isDisabled={skip <= 0}
              leftIcon={<ChevronLeftIcon w={5} h={5} />}
              onClick={() =>
                skip >= length ? setSkip(skip - length) : setSkip(0)
              }
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <Button
              isDisabled={
                totalSubmissions < skip + length ||
                (skip > 0 && skip % length !== 0)
              }
              onClick={() => skip % length === 0 && setSkip(skip + length)}
              rightIcon={<ChevronRightIcon w={5} h={5} />}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </Flex>
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

export default BountySubmissions;
