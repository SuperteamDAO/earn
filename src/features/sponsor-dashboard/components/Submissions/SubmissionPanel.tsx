import { ArrowForwardIcon, CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Link, Text, Tooltip } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import NextLink from 'next/link';
import React, { type Dispatch, type SetStateAction } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';

import type { Listing, Rewards } from '@/features/listings';
import { EarnAvatar } from '@/features/talent';
import type { SubmissionWithUser } from '@/interface/submission';
import { dayjs } from '@/utils/dayjs';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import { selectedSubmissionAtom } from '../..';
import { Details } from './Details';
import { PayoutButton } from './PayoutButton';
import { SelectLabel } from './SelectLabel';
import { SelectWinner } from './SelectWinner';

interface Props {
  bounty: Listing | undefined;
  submissions: SubmissionWithUser[];
  usedPositions: number[];
  isHackathonPage?: boolean;
  onWinnersAnnounceOpen: () => void;
  remainings: { podiums: number; bonus: number } | null;
  setRemainings: Dispatch<
    SetStateAction<{ podiums: number; bonus: number } | null>
  >;
}

export const SubmissionPanel = ({
  bounty,
  submissions,
  usedPositions,
  isHackathonPage,
  onWinnersAnnounceOpen,
  remainings,
  setRemainings,
}: Props) => {
  const afterAnnounceDate =
    bounty?.type === 'hackathon'
      ? dayjs().isAfter(bounty?.Hackathon?.announceDate)
      : true;

  const [selectedSubmission] = useAtom(selectedSubmissionAtom);

  return (
    <>
      <Box w="100%">
        {submissions.length ? (
          <>
            <Box
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
                pt={3}
              >
                <Flex align="center" gap={2} w="full">
                  <EarnAvatar
                    size="40px"
                    id={selectedSubmission?.user?.id}
                    avatar={selectedSubmission?.user?.photo || undefined}
                  />
                  <Box>
                    <Text
                      w="100%"
                      color="brand.slate.900"
                      fontSize="md"
                      fontWeight={500}
                      whiteSpace={'nowrap'}
                    >
                      {`${selectedSubmission?.user?.firstName}'s Submission`}
                    </Text>
                    <Link
                      as={NextLink}
                      w="100%"
                      color="brand.purple"
                      fontSize="xs"
                      fontWeight={500}
                      whiteSpace={'nowrap'}
                      href={`/t/${selectedSubmission?.user?.username}`}
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
                  {selectedSubmission?.isWinner &&
                    selectedSubmission?.winnerPosition &&
                    !selectedSubmission?.isPaid &&
                    (bounty?.isWinnersAnnounced ? (
                      <PayoutButton bounty={bounty} />
                    ) : (
                      <>
                        <Tooltip
                          bg={'brand.purple'}
                          hasArrow={true}
                          isDisabled={!!bounty?.isWinnersAnnounced}
                          label="Please announce the winners before you paying out the winners"
                          placement="top"
                        >
                          <Button
                            mr={4}
                            isDisabled={!bounty?.isWinnersAnnounced}
                            size="sm"
                            variant="solid"
                          >
                            Pay {bounty?.token}{' '}
                            {!!bounty?.rewards &&
                              bounty?.rewards[
                                selectedSubmission?.winnerPosition as keyof Rewards
                              ]}
                          </Button>
                        </Tooltip>
                      </>
                    ))}
                  {<SelectLabel listingSlug={bounty?.slug!} />}
                  {selectedSubmission?.isWinner &&
                    selectedSubmission?.winnerPosition &&
                    selectedSubmission?.isPaid && (
                      <Button
                        mr={4}
                        onClick={() => {
                          window.open(
                            `https://solscan.io/tx/${selectedSubmission?.paymentDetails?.txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`,
                            '_blank',
                          );
                        }}
                        rightIcon={<ExternalLinkIcon />}
                        size="md"
                        variant="ghost"
                      >
                        View Payment Txn
                      </Button>
                    )}
                  {!bounty?.isWinnersAnnounced && (
                    <SelectWinner
                      bounty={bounty}
                      usedPositions={usedPositions}
                      setRemainings={setRemainings}
                      submissions={submissions}
                      isHackathonPage={isHackathonPage}
                    />
                  )}
                  {!bounty?.isWinnersAnnounced && (
                    <Tooltip
                      bg={'brand.purple'}
                      hasArrow={true}
                      isDisabled={!bounty?.isWinnersAnnounced}
                      label="You cannot change the winners once the results are published!"
                      placement="top"
                    >
                      <Button
                        ml={4}
                        _disabled={{
                          bg: '#A1A1A1',
                          cursor: 'not-allowed',
                          _hover: {
                            bg: '#A1A1A1',
                          },
                        }}
                        isDisabled={
                          !afterAnnounceDate ||
                          isHackathonPage ||
                          remainings?.podiums !== 0 ||
                          remainings?.bonus !== 0
                        }
                        onClick={onWinnersAnnounceOpen}
                        variant={'solid'}
                      >
                        Announce Winners
                      </Button>
                    </Tooltip>
                  )}
                </Flex>
              </Flex>
              {!!remainings && (
                <Flex
                  w="fit-content"
                  ml="auto"
                  px={4}
                  py={1}
                  fontSize={'xs'}
                  fontStyle="italic"
                >
                  {!!(remainings.bonus > 0 || remainings.podiums > 0) ? (
                    <Text color="#F55151">
                      {remainings.podiums > 0 && (
                        <>
                          {remainings.podiums}{' '}
                          {remainings.podiums === 1 ? 'Winner' : 'Winners'}{' '}
                        </>
                      )}
                      {remainings.bonus > 0 && (
                        <>
                          {remainings.bonus}{' '}
                          {remainings.bonus === 1 ? 'Bonus' : 'Bonus'}{' '}
                        </>
                      )}
                      Remaining
                    </Text>
                  ) : (
                    <Text color="#48CB6D">All winners selected</Text>
                  )}
                </Flex>
              )}

              <Flex align="center" gap={5} px={5} py={2}>
                {selectedSubmission?.user?.email && (
                  <Flex align="center" justify="start" gap={2} fontSize="sm">
                    <MdOutlineMail color="#94A3B8" />
                    <Link
                      color="brand.slate.400"
                      href={`mailto:${selectedSubmission.user.email}`}
                      isExternal
                    >
                      {truncateString(selectedSubmission?.user?.email, 36)}
                    </Link>
                  </Flex>
                )}
                {selectedSubmission?.user?.publicKey && (
                  <Flex
                    align="center"
                    justify="start"
                    gap={2}
                    fontSize="sm"
                    whiteSpace={'nowrap'}
                  >
                    <MdOutlineAccountBalanceWallet color="#94A3B8" />
                    <Text color="brand.slate.400">
                      {truncatePublicKey(
                        selectedSubmission?.user?.publicKey,
                        3,
                      )}
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
                {selectedSubmission?.user?.twitter && (
                  <Flex align="center" justify="start" gap={2} fontSize="sm">
                    <FaXTwitter color="#94A3B8" />

                    <Link
                      color="brand.slate.400"
                      href={selectedSubmission?.user?.twitter}
                      isExternal
                    >
                      {truncateString(selectedSubmission?.user?.twitter, 36)}
                    </Link>
                  </Flex>
                )}
              </Flex>
            </Box>

            <Details bounty={bounty} />
          </>
        ) : (
          <Box p={3}>
            <Text color={'brand.slate.500'} fontSize={'xl'} fontWeight={500}>
              No submissions found
            </Text>
            <Text color={'brand.slate.400'} fontSize={'sm'}>
              Try a different search query
            </Text>
          </Box>
        )}
      </Box>
    </>
  );
};
