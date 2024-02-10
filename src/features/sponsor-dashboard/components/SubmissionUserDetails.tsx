import { CopyIcon } from '@chakra-ui/icons';
import { Box, Flex, Image, Link, Text, Tooltip } from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import router from 'next/router';
import React from 'react';
import { BsTwitterX } from 'react-icons/bs';
import { CiGlobe } from 'react-icons/ci';
import { FaDiscord, FaGithub, FaLinkedin } from 'react-icons/fa';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';

import type { SubmissionWithUser } from '@/interface/submission';
import { getURLSanitized } from '@/utils/submissions/getURLSanitized';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

interface Props {
  submissions: SubmissionWithUser[];
  selectedSubmission: SubmissionWithUser | undefined;
}

export const SubmissionUserDetails = ({
  submissions,
  selectedSubmission,
}: Props) => {
  return (
    <Box
      w="70%"
      bg="white"
      border="1px solid"
      borderColor="brand.slate.200"
      roundedRight={'xl'}
    >
      {submissions.length ? (
        <>
          <Flex justify={'space-around'} direction={'column'} h="100%">
            <Flex
              align={'center'}
              direction={'column'}
              my={2}
              px={4}
              py={3}
              cursor={'pointer'}
              onClick={() =>
                window.open(
                  `${router.basePath}/t/${selectedSubmission?.user?.username}/`,
                  '_blank',
                )
              }
            >
              {selectedSubmission?.user?.photo ? (
                <Image
                  boxSize="48px"
                  borderRadius="full"
                  alt={`${selectedSubmission?.user?.firstName} ${selectedSubmission?.user?.lastName}`}
                  src={selectedSubmission?.user?.photo}
                />
              ) : (
                <Avatar
                  name={`${selectedSubmission?.user?.firstName} ${selectedSubmission?.user?.lastName}`}
                  colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                  size={48}
                  variant="marble"
                />
              )}
              <Text
                mt={2}
                color="brand.slate.700"
                fontSize="md"
                fontWeight={500}
                textAlign={'center'}
              >
                {selectedSubmission?.user?.firstName}{' '}
                {selectedSubmission?.user?.lastName}
              </Text>

              <Text
                maxW="200px"
                color="brand.slate.400"
                fontSize="md"
                fontWeight={500}
                textAlign={'center'}
              >
                @{selectedSubmission?.user?.username}
              </Text>
            </Flex>
            <Flex direction={'column'} px={4} pb={6}>
              {selectedSubmission?.user?.email && (
                <Flex align="center" justify="start" gap={2} fontSize="sm">
                  <MdOutlineMail color="#94A3B8" />
                  <Link
                    color="brand.slate.400"
                    href={`mailto:${selectedSubmission.user.email}`}
                    isExternal
                  >
                    {selectedSubmission?.user?.email}
                  </Link>
                </Flex>
              )}
              {selectedSubmission?.user?.publicKey && (
                <Flex align="center" justify="start" gap={2} fontSize="sm">
                  <MdOutlineAccountBalanceWallet color="#94A3B8" />
                  <Text color="brand.slate.400">
                    {truncatePublicKey(selectedSubmission?.user?.publicKey, 6)}
                    <Tooltip label="Copy Wallet ID" placement="right">
                      <CopyIcon
                        cursor="pointer"
                        ml={1}
                        color="brand.slate.400"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            selectedSubmission?.user?.publicKey || '',
                          )
                        }
                      />
                    </Tooltip>
                  </Text>
                </Flex>
              )}
              {selectedSubmission?.user?.discord && (
                <Flex align="center" justify="start" gap={2} fontSize="sm">
                  <FaDiscord color="#94A3B8" />

                  <Text color="brand.slate.400">
                    {selectedSubmission?.user?.discord || '-'}
                  </Text>
                </Flex>
              )}
              {selectedSubmission?.user?.twitter && (
                <Flex align="center" justify="start" gap={2} fontSize="sm">
                  <BsTwitterX color="#94A3B8" />

                  <Link
                    color="brand.slate.400"
                    href={getURLSanitized(
                      selectedSubmission?.user?.twitter || '#',
                    )}
                    isExternal
                  >
                    {selectedSubmission?.user?.twitter || '-'}
                  </Link>
                </Flex>
              )}
              {selectedSubmission?.user?.linkedin && (
                <Flex align="center" justify="start" gap={2} fontSize="sm">
                  <FaLinkedin color="#94A3B8" />

                  <Link
                    color="brand.slate.400"
                    href={getURLSanitized(
                      selectedSubmission?.user?.linkedin || '#',
                    )}
                    isExternal
                  >
                    {selectedSubmission?.user?.linkedin || '-'}
                  </Link>
                </Flex>
              )}
              {selectedSubmission?.user?.github && (
                <Flex align="center" justify="start" gap={2} fontSize="sm">
                  <FaGithub color="#94A3B8" />
                  <Link
                    color="brand.slate.400"
                    href={getURLSanitized(
                      selectedSubmission?.user?.github || '#',
                    )}
                    isExternal
                  >
                    {selectedSubmission?.user?.github || '-'}
                  </Link>
                </Flex>
              )}
              {selectedSubmission?.user?.website && (
                <Flex align="center" justify="start" gap={2} fontSize="sm">
                  <CiGlobe color="#94A3B8" />

                  <Link
                    color="brand.slate.400"
                    href={getURLSanitized(
                      selectedSubmission?.user?.website || '#',
                    )}
                    isExternal
                  >
                    {selectedSubmission?.user?.website || '-'}
                  </Link>
                </Flex>
              )}
            </Flex>
          </Flex>
        </>
      ) : (
        <></>
      )}
    </Box>
  );
};
