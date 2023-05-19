import { ChevronLeftIcon, ChevronRightIcon, LinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  Image,
  Link,
  Select,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import axios from 'axios';
import Avatar from 'boring-avatars';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import LoadingSection from '@/components/shared/LoadingSection';
import type { Bounty } from '@/interface/bounty';
import type { SubmissionWithUser } from '@/interface/submission';
import Sidebar from '@/layouts/Sidebar';

interface Props {
  slug: string;
}

function BountySubmissions({ slug }: Props) {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
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
      console.log(
        'file: [slug].tsx:22 ~ getsubmission ~ submissionsDetails:',
        submissionsDetails
      );
      setTotalSubmissions(submissionsDetails.data.total);
      setSubmissions(submissionsDetails.data.data);
      setIsBountyLoading(false);
    } catch (e) {
      console.log(e);
      setIsBountyLoading(false);
    }
  };

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${slug}/`);
      console.log(
        'file: [slug].tsx:22 ~ getBounty ~ bountyDetails:',
        bountyDetails
      );
      setBounty(bountyDetails.data);
      getSubmissions(bountyDetails.data.id);
      setRewards(Object.keys(bountyDetails.data.rewards || {}));
    } catch (e) {
      console.log(e);
      setIsBountyLoading(false);
    }
  };

  useEffect(() => {
    getBounty();
  }, []);

  useEffect(() => {
    getSubmissions();
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

  return (
    <Sidebar>
      {isBountyLoading ? (
        <LoadingSection />
      ) : (
        <>
          <Box mb={4}>
            <Breadcrumb color="brand.slate.400">
              <BreadcrumbItem>
                <BreadcrumbLink
                  color="brand.slate.400"
                  href="/dashboard/bounties"
                >
                  <Flex align="center">
                    <ChevronLeftIcon mr={1} w={6} h={6} />
                    Bounties
                  </Flex>
                </BreadcrumbLink>
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
          <Flex justify="start" mb={4}>
            <Text color="brand.slate.500">
              {totalSubmissions}{' '}
              <Text as="span" color="brand.slate.400">
                Submissions
              </Text>
            </Text>
          </Flex>
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
                        <Flex align="center">
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
                          {submission?.link && <LinkIcon w={3} h={3} mr={1} />}
                          {submission?.link && submission?.link?.length >= 25
                            ? `${submission?.link?.slice(0, 25)}...`
                            : submission?.link || '-'}
                        </Link>
                      </Td>
                      <Td pl={0} textAlign="center">
                        <Link
                          color="brand.purple"
                          href={submission?.tweet || '#'}
                          isExternal
                        >
                          {submission?.tweet && <LinkIcon w={3} h={3} mr={1} />}
                          {submission?.tweet && submission?.tweet?.length >= 25
                            ? `${submission?.tweet?.slice(0, 25)}...`
                            : submission?.tweet || '-'}
                        </Link>
                      </Td>
                      <Td>
                        <Select placeholder="Select Winner">
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
              isDisabled={skip > 0 && skip % length !== 0}
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
