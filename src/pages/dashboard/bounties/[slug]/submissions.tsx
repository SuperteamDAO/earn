import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
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
  Select,
  Spinner,
  Tag,
  TagLabel,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import type NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import type { TransactionInstruction } from '@solana/web3.js';
import { PublicKey, Transaction } from '@solana/web3.js';
import axios from 'axios';
import Avatar from 'boring-avatars';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import ErrorSection from '@/components/shared/ErrorSection';
import LoadingSection from '@/components/shared/LoadingSection';
import PublishResults from '@/components/submissions/PublishResults';
import { tokenList } from '@/constants';
import type { Bounty, Rewards } from '@/interface/bounty';
import type { SubmissionWithUser } from '@/interface/submission';
import Sidebar from '@/layouts/Sidebar';
import { userStore } from '@/store/user';
import {
  getBgColor,
  getBountyDraftStatus,
  getBountyProgress,
} from '@/utils/bounty';
import {
  connection,
  createPaymentSOL,
  createPaymentSPL,
} from '@/utils/contract/contract';
import { dayjs } from '@/utils/dayjs';
import { sortRank } from '@/utils/rank';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

interface Props {
  slug: string;
}

function BountySubmissions({ slug }: Props) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userInfo } = userStore();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [totalPaymentsMade, setTotalPaymentsMade] = useState(0);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithUser>();
  const [isSelectingWinner, setIsSelectingWinner] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [rewards, setRewards] = useState<string[]>([]);
  const [isBountyLoading, setIsBountyLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const anchorWallet = useAnchorWallet();
  const length = 15;

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(
        `/api/bounties/${slug}/submissions`
      );
      setBounty(bountyDetails.data);
      if (bountyDetails.data.sponsorId !== userInfo?.currentSponsorId) {
        router.push('/dashboard/bounties');
      }
      const submissionsData = bountyDetails.data.Submission || [];
      setSubmissions(submissionsData);
      setSelectedSubmission(submissionsData[0]);
      setTotalSubmissions(submissionsData.length);
      setTotalWinners(bountyDetails.data.winnersSelected || 0);
      setTotalPaymentsMade(bountyDetails.data.paymentsMade || 0);

      const ranks = sortRank(Object.keys(bountyDetails.data.rewards || {}));
      setRewards(ranks);
      setIsBountyLoading(false);
    } catch (e) {
      setIsBountyLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getBounty();
    }
  }, [userInfo?.currentSponsorId]);

  const bountyStatus = getBountyDraftStatus(
    bounty?.status,
    bounty?.isPublished
  );

  const bountyProgress = getBountyProgress(bounty);

  const selectWinner = async (position: string, id: string | undefined) => {
    if (!id) return;
    setIsSelectingWinner(true);
    try {
      await axios.post(`/api/submission/toggleWinner/`, {
        id,
        isWinner: !!position,
        winnerPosition: position || null,
      });
      const submissionIndex = submissions.findIndex((s) => s.id === id);
      if (submissionIndex >= 0) {
        const oldRank: string =
          submissions[submissionIndex]?.winnerPosition || '';
        const updatedSubmission: SubmissionWithUser = {
          ...(submissions[submissionIndex] as SubmissionWithUser),
          isWinner: !!position,
          winnerPosition: (position as keyof Rewards) || undefined,
        };
        const newSubmissions = [...submissions];
        newSubmissions[submissionIndex] = updatedSubmission;
        setSubmissions(newSubmissions);
        setSelectedSubmission(updatedSubmission);
        if (!position) {
          setTotalWinners(totalWinners - 1);
          const ranks = sortRank([...new Set([...rewards, oldRank])]);
          setRewards(ranks);
        } else {
          setTotalWinners(totalWinners + 1);
          const ranks = rewards.filter((r) => r !== position);
          setRewards(ranks);
        }
      }
      setIsSelectingWinner(false);
    } catch (e) {
      setIsSelectingWinner(false);
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

  const getURLSanitized = (url: string) => {
    if (!url || url === '-' || url === '#') return url;
    if (
      !url.includes('https://') &&
      !url.includes('http://') &&
      !url.includes('www')
    ) {
      return `https://${url}`;
    }
    return url;
  };

  const handlePayout = async ({
    id,
    token,
    amount,
    receiver,
  }: {
    id: string;
    token: string;
    amount: number;
    receiver: PublicKey;
  }) => {
    setIsPaying(true);
    let sig = '';
    try {
      const power = tokenList.find((e) => e.tokenSymbol === token)
        ?.decimals as number;
      const tokenAddress = tokenList.find((e) => e.tokenSymbol === token)
        ?.mintAddress as string;
      if (token === 'SOL') {
        const ix = await createPaymentSOL(
          anchorWallet as NodeWallet,
          receiver,
          amount,
          JSON.stringify(Math.floor(Math.random() * 1000000000))
        );
        const tx = new Transaction();
        tx.add(ix);
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = (anchorWallet as NodeWallet).publicKey;
        const signTx = await anchorWallet?.signTransaction(tx);
        sig = await connection.sendRawTransaction(signTx!.serialize());
      } else {
        const [ix, ix2] = await createPaymentSPL(
          anchorWallet as NodeWallet,
          receiver,
          (amount * 10 ** power) as number,
          new PublicKey(tokenAddress as string),
          JSON.stringify(Math.floor(Math.random() * 10000))
        );
        const tx = new Transaction();
        if (ix2) {
          tx.add(ix2 as TransactionInstruction);
        }
        tx.add(ix as TransactionInstruction);
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = (anchorWallet as NodeWallet).publicKey;
        const signTx = await anchorWallet?.signTransaction(tx);
        sig = await connection.sendRawTransaction(signTx!.serialize(), {
          skipPreflight: false,
        });
      }
      if (sig) {
        await axios.post(`/api/submission/addPayment/`, {
          id,
          isPaid: true,
          paymentDetails: {
            txId: sig,
          },
        });
        const submissionIndex = submissions.findIndex((s) => s.id === id);
        if (submissionIndex >= 0) {
          const updatedSubmission: SubmissionWithUser = {
            ...(submissions[submissionIndex] as SubmissionWithUser),
            isPaid: true,
            paymentDetails: {
              txId: sig,
            },
          };
          const newSubmissions = [...submissions];
          newSubmissions[submissionIndex] = updatedSubmission;
          setSubmissions(newSubmissions);
          setSelectedSubmission(updatedSubmission);
          setTotalPaymentsMade(totalPaymentsMade + 1);
        }
      }
      setIsPaying(false);
    } catch (error) {
      console.log(error);
      setIsPaying(false);
    }
  };

  return (
    <Sidebar>
      {isBountyLoading ? (
        <LoadingSection />
      ) : (
        <>
          {isOpen && (
            <PublishResults
              isOpen={isOpen}
              onClose={onClose}
              totalWinners={totalWinners}
              totalPaymentsMade={totalPaymentsMade}
              rewards={Object.keys(bounty?.rewards || {})}
              bountyId={bounty?.id}
              isDeadlinePassed={dayjs().isAfter(bounty?.deadline)}
              hasWinnersAnnounced={bounty?.isWinnersAnnounced}
            />
          )}
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
          <Flex justify="start" gap={2} mb={4}>
            <Text color="brand.slate.500" fontSize="lg" fontWeight="700">
              {bounty?.title}
            </Text>
            <Tag
              color={'white'}
              bg={getBgColor(bountyStatus)}
              size="sm"
              variant="solid"
            >
              {bountyStatus}
            </Tag>
            <Tag
              color={'white'}
              bg={getBgColor(bountyProgress)}
              size="sm"
              variant="solid"
            >
              {bountyProgress}
            </Tag>
          </Flex>
          <Flex align="center" justify="space-between" mb={4}>
            <Text color="brand.slate.500">
              {totalSubmissions}{' '}
              <Text as="span" color="brand.slate.400">
                Submissions
              </Text>
            </Text>
            <Flex align="center" justify="flex-end">
              <Button
                isLoading={isExporting}
                leftIcon={<DownloadIcon />}
                loadingText={'Exporting...'}
                onClick={() => exportSubmissionsCsv()}
                variant={'outline'}
              >
                Export CSV
              </Button>
              <Button
                ml={4}
                leftIcon={<BellIcon />}
                onClick={onOpen}
                variant={'solid'}
              >
                Publish Results
              </Button>
            </Flex>
          </Flex>
          {!submissions?.length ? (
            <ErrorSection
              title="No submissions found!"
              message="View your bounty submissions here once they are submitted"
            />
          ) : (
            <Flex align={'start'} bg="white">
              <Flex flex="1 1 auto" minW={{ base: 'none', md: 96 }}>
                <Box
                  w="full"
                  bg="white"
                  border="1px solid"
                  borderColor={'blackAlpha.200'}
                  roundedLeft="xl"
                >
                  {submissions.map((submission, submissionIndex) => {
                    return (
                      <Flex
                        key={submission?.id}
                        align={'center'}
                        justify={'space-between'}
                        gap={4}
                        px={4}
                        py={3}
                        bg={
                          selectedSubmission?.user?.id === submission?.user?.id
                            ? 'brand.slate.100'
                            : 'transparent'
                        }
                        borderBottom={
                          submissionIndex < submissions.length - 1
                            ? '1px solid'
                            : 'none'
                        }
                        borderBottomColor="blackAlpha.200"
                        _hover={{
                          backgroundColor: 'brand.slate.100',
                        }}
                        cursor="pointer"
                        onClick={() => {
                          setSelectedSubmission(submission);
                        }}
                      >
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
                        {submission?.isWinner && submission?.winnerPosition && (
                          <Tag colorScheme="green">
                            <TagLabel>
                              🏆: {submission?.winnerPosition || 'Winner'}
                            </TagLabel>
                          </Tag>
                        )}
                      </Flex>
                    );
                  })}
                </Box>
              </Flex>
              <Flex flex="4 1 auto">
                <Box
                  w="full"
                  bg="white"
                  border="1px solid"
                  borderColor="blackAlpha.200"
                  roundedRight="xl"
                >
                  <Flex
                    align="center"
                    justify={'space-between'}
                    w="full"
                    px={4}
                    py={3}
                    borderBottom="1px solid"
                    borderBottomColor="blackAlpha.200"
                  >
                    <Flex align="center">
                      {selectedSubmission?.user?.photo ? (
                        <Image
                          boxSize="32px"
                          borderRadius="full"
                          alt={`${selectedSubmission?.user?.firstName} ${selectedSubmission?.user?.lastName}`}
                          src={selectedSubmission?.user?.photo}
                        />
                      ) : (
                        <Avatar
                          name={`${selectedSubmission?.user?.firstName} ${selectedSubmission?.user?.lastName}`}
                          colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                          size={32}
                          variant="marble"
                        />
                      )}
                      <Box display={{ base: 'none', md: 'block' }} ml={2}>
                        <Text color="brand.slate.800" fontSize="sm">
                          {`${selectedSubmission?.user?.firstName} ${selectedSubmission?.user?.lastName}`}
                        </Text>
                        <Text color="brand.slate.500" fontSize="xs">
                          {selectedSubmission?.user?.email}
                        </Text>
                      </Box>
                    </Flex>
                    <Flex align="center" justify={'flex-end'} gap={2} w="full">
                      {selectedSubmission?.isWinner &&
                        selectedSubmission?.winnerPosition &&
                        !selectedSubmission?.isPaid && (
                          <Tooltip
                            bg={'brand.purple'}
                            hasArrow={true}
                            isDisabled={!!bounty?.isWinnersAnnounced}
                            label="You have to publish the results before you can pay out rewards!"
                            placement="top"
                          >
                            <Button
                              mr={4}
                              isDisabled={!bounty?.isWinnersAnnounced}
                              isLoading={isPaying}
                              loadingText={'Paying...'}
                              onClick={async () =>
                                handlePayout({
                                  id: selectedSubmission?.id as string,
                                  token: bounty?.token as string,
                                  amount: bounty?.rewards![
                                    selectedSubmission?.winnerPosition as keyof Rewards
                                  ] as number,
                                  receiver: new PublicKey(
                                    selectedSubmission.user.publicKey
                                  ),
                                })
                              }
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
                        )}
                      {selectedSubmission?.isWinner &&
                        selectedSubmission?.winnerPosition &&
                        selectedSubmission?.isPaid && (
                          <Button
                            mr={4}
                            onClick={() => {
                              window.open(
                                `https://solscan.io/tx/${selectedSubmission?.paymentDetails?.txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`,
                                '_blank'
                              );
                            }}
                            rightIcon={<ExternalLinkIcon />}
                            size="sm"
                            variant="ghost"
                          >
                            View Payment Txn
                          </Button>
                        )}
                      {isSelectingWinner && (
                        <Spinner color="brand.slate.400" size="sm" />
                      )}
                      <Tooltip
                        bg={'brand.purple'}
                        hasArrow={true}
                        isDisabled={!bounty?.isWinnersAnnounced}
                        label="You cannot change the winners once the results are published!"
                        placement="top"
                      >
                        <Select
                          maxW={48}
                          textTransform="capitalize"
                          borderColor="brand.slate.300"
                          _placeholder={{
                            color: 'brand.slate.300',
                          }}
                          focusBorderColor="brand.purple"
                          isDisabled={!!bounty?.isWinnersAnnounced}
                          onChange={(e) =>
                            selectWinner(e.target.value, selectedSubmission?.id)
                          }
                          value={
                            selectedSubmission?.isWinner
                              ? selectedSubmission?.winnerPosition || ''
                              : ''
                          }
                        >
                          <option value={''}>Select Winner</option>
                          {selectedSubmission?.isWinner &&
                            rewards.length <
                              Object.keys(bounty?.rewards || {})?.length && (
                              <option
                                value={selectedSubmission?.winnerPosition || ''}
                              >
                                {selectedSubmission?.winnerPosition}
                              </option>
                            )}
                          {rewards.map((reward) => (
                            <option key={reward} value={reward}>
                              {reward}
                            </option>
                          ))}
                        </Select>
                      </Tooltip>
                    </Flex>
                  </Flex>
                  <Box w="full" px={4} py={5}>
                    {bounty?.type === 'open' && (
                      <>
                        <Box mb={4}>
                          <Text
                            mb={1}
                            color="brand.slate.400"
                            fontSize="xs"
                            fontWeight={600}
                            textTransform={'uppercase'}
                          >
                            Main Submission
                          </Text>
                          <Link
                            color="brand.purple"
                            wordBreak={'break-all'}
                            href={getURLSanitized(
                              selectedSubmission?.link || '#'
                            )}
                            isExternal
                          >
                            {selectedSubmission?.link && (
                              <LinkIcon w={4} h={4} mr={2} />
                            )}
                            {selectedSubmission?.link
                              ? getURLSanitized(selectedSubmission?.link)
                              : '-'}
                          </Link>
                        </Box>
                        <Box mb={4}>
                          <Text
                            mb={1}
                            color="brand.slate.400"
                            fontSize="xs"
                            fontWeight={600}
                            textTransform={'uppercase'}
                          >
                            Tweet Link
                          </Text>
                          <Link
                            color="brand.purple"
                            wordBreak={'break-all'}
                            href={getURLSanitized(
                              selectedSubmission?.tweet || '#'
                            )}
                            isExternal
                          >
                            {selectedSubmission?.tweet && (
                              <LinkIcon w={4} h={4} mr={2} />
                            )}
                            {selectedSubmission?.tweet
                              ? getURLSanitized(selectedSubmission?.tweet)
                              : '-'}
                          </Link>
                        </Box>
                      </>
                    )}
                    {bounty?.type === 'permissioned' &&
                      selectedSubmission?.eligibilityAnswers?.map(
                        (answer: any, answerIndex: number) => (
                          <Box key={answerIndex} mb={4}>
                            <Text
                              mb={1}
                              color="brand.slate.400"
                              fontSize="xs"
                              fontWeight={600}
                              textTransform={'uppercase'}
                            >
                              {answer.question}
                            </Text>
                            <Text
                              color="brand.slate.700"
                              wordBreak={'break-all'}
                            >
                              {answer.answer || '-'}
                            </Text>
                          </Box>
                        )
                      )}
                    <Box mb={4}>
                      <Text
                        mb={1}
                        color="brand.slate.400"
                        fontSize="xs"
                        fontWeight={600}
                        textTransform={'uppercase'}
                      >
                        Anything Else
                      </Text>
                      <Text color="brand.slate.700" wordBreak={'break-all'}>
                        {selectedSubmission?.otherInfo || '-'}
                      </Text>
                    </Box>
                    <Box mb={4}>
                      <Text
                        mb={2}
                        color="brand.slate.400"
                        fontSize="xs"
                        fontWeight={600}
                        textTransform={'uppercase'}
                      >
                        User Profile
                      </Text>
                      <Flex
                        align="start"
                        justify="start"
                        gap={2}
                        mb={4}
                        fontSize="sm"
                      >
                        <Text w={20} color="brand.slate.400">
                          Bio:
                        </Text>
                        <Text color="brand.slate.700">
                          {selectedSubmission?.user?.bio || '-'}
                        </Text>
                      </Flex>
                      <Flex
                        align="center"
                        justify="start"
                        gap={2}
                        mb={4}
                        fontSize="sm"
                      >
                        <Text w={20} color="brand.slate.400">
                          Wallet:
                        </Text>
                        <Text color="brand.slate.700">
                          {truncatePublicKey(
                            selectedSubmission?.user?.publicKey
                          )}
                          <Tooltip label="Copy Wallet ID" placement="right">
                            <CopyIcon
                              cursor="pointer"
                              ml={1}
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  selectedSubmission?.user?.publicKey || ''
                                )
                              }
                            />
                          </Tooltip>
                        </Text>
                      </Flex>
                      <Flex
                        align="center"
                        justify="start"
                        gap={2}
                        mb={4}
                        fontSize="sm"
                      >
                        <Text w={20} color="brand.slate.400">
                          Discord:
                        </Text>
                        <Text color="brand.slate.700">
                          {selectedSubmission?.user?.discord || '-'}
                        </Text>
                      </Flex>
                      <Flex
                        align="center"
                        justify="start"
                        gap={2}
                        mb={4}
                        fontSize="sm"
                      >
                        <Text w={20} color="brand.slate.400">
                          Twitter:
                        </Text>
                        <Link
                          color="brand.slate.700"
                          href={selectedSubmission?.user?.twitter || undefined}
                          isExternal
                        >
                          {selectedSubmission?.user?.twitter || '-'}
                        </Link>
                      </Flex>
                      <Flex
                        align="center"
                        justify="start"
                        gap={2}
                        mb={4}
                        fontSize="sm"
                      >
                        <Text w={20} color="brand.slate.400">
                          LinkedIn:
                        </Text>
                        <Link
                          color="brand.slate.700"
                          href={selectedSubmission?.user?.linkedin || undefined}
                          isExternal
                        >
                          {selectedSubmission?.user?.linkedin
                            ? `${selectedSubmission?.user?.linkedin?.slice(
                                0,
                                25
                              )}${
                                selectedSubmission?.user?.linkedin?.length >=
                                  25 && '...'
                              }` || '-'
                            : '-'}
                        </Link>
                      </Flex>
                      <Flex
                        align="center"
                        justify="start"
                        gap={2}
                        mb={4}
                        fontSize="sm"
                      >
                        <Text w={20} color="brand.slate.400">
                          GitHub:
                        </Text>
                        <Link
                          color="brand.slate.700"
                          href={selectedSubmission?.user?.github || undefined}
                          isExternal
                        >
                          {selectedSubmission?.user?.github || '-'}
                        </Link>
                      </Flex>
                      <Flex
                        align="center"
                        justify="start"
                        gap={2}
                        mb={4}
                        fontSize="sm"
                      >
                        <Text w={20} color="brand.slate.400">
                          Website:
                        </Text>
                        <Link
                          color="brand.slate.700"
                          href={selectedSubmission?.user?.website || undefined}
                          isExternal
                        >
                          {selectedSubmission?.user?.website || '-'}
                        </Link>
                      </Flex>
                      <Flex
                        align="center"
                        justify="start"
                        gap={2}
                        mb={4}
                        fontSize="sm"
                      >
                        <Button
                          onClick={() =>
                            window.open(
                              `${router.basePath}/t/${selectedSubmission?.user?.username}/`,
                              '_ blank'
                            )
                          }
                          rightIcon={<ExternalLinkIcon />}
                          size="sm"
                          variant="outline"
                        >
                          View Full Profile
                        </Button>
                      </Flex>
                    </Box>
                  </Box>
                </Box>
              </Flex>
            </Flex>
          )}
          <Flex align="center" justify="start" gap={4} mt={4}>
            <Button
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
            <Text color="brand.slate.400" fontSize="sm">
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
              Submissions
            </Text>
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
