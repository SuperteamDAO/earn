import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Divider,
  Flex,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link,
  Select,
  Spinner,
  Tag,
  TagLabel,
  Text,
  Tooltip,
  useClipboard,
  useDisclosure,
} from '@chakra-ui/react';
import type NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import type { TransactionInstruction } from '@solana/web3.js';
import { PublicKey, Transaction } from '@solana/web3.js';
import axios from 'axios';
import Avatar from 'boring-avatars';
import debounce from 'lodash.debounce';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { BsTwitterX } from 'react-icons/bs';
import { CiGlobe } from 'react-icons/ci';
import { FaDiscord, FaGithub, FaLinkedin } from 'react-icons/fa';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { PublishResults } from '@/components/submissions/PublishResults';
import { tokenList } from '@/constants';
import type { Bounty, Rewards } from '@/interface/bounty';
import type { SubmissionWithUser } from '@/interface/submission';
import { Sidebar } from '@/layouts/Sponsor';
import { userStore } from '@/store/user';
import {
  formatDeadline,
  getBountyStatus,
  getColorStyles,
} from '@/utils/bounty';
import {
  connection,
  createPaymentSOL,
  createPaymentSPL,
} from '@/utils/contract/contract';
import { dayjs } from '@/utils/dayjs';
import { sortRank } from '@/utils/rank';
import { getURLSanitized } from '@/utils/submissions/getURLSanitized';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { getURL } from '@/utils/validUrl';

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
  const length = 10;
  const [searchText, setSearchText] = useState('');

  const [usedPositions, setUsedPositions] = useState<string[]>([]);

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  const { connected, publicKey } = useWallet();

  const DynamicWalletMultiButton = dynamic(
    async () =>
      (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false },
  );

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${slug}/`);
      setBounty(bountyDetails.data);
      if (bountyDetails.data.sponsorId !== userInfo?.currentSponsorId) {
        router.push('/dashboard/listings');
      }
      setTotalPaymentsMade(bountyDetails.data.paymentsMade || 0);

      const usedPos = bountyDetails.data.Submission.filter(
        (s: any) => s.isWinner,
      ).map((s: any) => s.winnerPosition);
      setUsedPositions(usedPos);

      setTotalSubmissions(bountyDetails.data.totalSubmissions);
      setTotalWinners(bountyDetails.data.winnersSelected);
      setTotalPaymentsMade(bountyDetails.data.paymentsMade);

      const ranks = sortRank(Object.keys(bountyDetails.data.rewards || {}));
      setRewards(ranks);
      setIsBountyLoading(false);
    } catch (e) {
      setIsBountyLoading(false);
    }
  };

  const getSubmissions = async () => {
    try {
      const submissionDetails = await axios.get(
        `/api/bounties/${slug}/submissions`,
        {
          params: {
            searchText,
            take: length,
            skip,
          },
        },
      );
      setSubmissions(submissionDetails.data);
      setSelectedSubmission(submissionDetails.data[0]);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getSubmissions();
    }
  }, [userInfo?.currentSponsorId, skip, searchText]);

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getBounty();
    }
  }, [userInfo?.currentSponsorId]);

  const bountyStatus = getBountyStatus(bounty);

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

        let newUsedPositions = [...usedPositions];
        if (oldRank && oldRank !== position) {
          newUsedPositions = newUsedPositions.filter((pos) => pos !== oldRank);
        }

        if (position && !newUsedPositions.includes(position)) {
          newUsedPositions.push(position);
        }
        setUsedPositions(newUsedPositions);

        const updatedSubmission: SubmissionWithUser = {
          ...(submissions[submissionIndex] as SubmissionWithUser),
          isWinner: !!position,
          winnerPosition: (position as keyof Rewards) || undefined,
        };
        const newSubmissions = [...submissions];
        newSubmissions[submissionIndex] = updatedSubmission;
        setSubmissions(newSubmissions);
        setSelectedSubmission(updatedSubmission);
        setTotalWinners(newUsedPositions.length);
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
        `/api/submission/${bounty?.id}/export/`,
      );
      const url = exportURL?.data?.url || '';
      window.open(url, '_blank');
      setIsExporting(false);
    } catch (e) {
      setIsExporting(false);
    }
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
          JSON.stringify(Math.floor(Math.random() * 1000000000)),
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
          JSON.stringify(Math.floor(Math.random() * 10000)),
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

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  const deadline = formatDeadline(bounty?.deadline, bounty?.applicationType);
  const { hasCopied, onCopy } = useClipboard(`${getURL()}t/${bounty?.slug}`);

  return (
    <Sidebar showBanner={false}>
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
              isRolling={bounty?.type === 'rolling'}
            />
          )}
          <Box mb={2}>
            <Breadcrumb color="brand.slate.400">
              <BreadcrumbItem>
                <NextLink href="/dashboard/listings" passHref>
                  <BreadcrumbLink color="brand.slate.400">
                    <Flex align="center">
                      <ChevronLeftIcon mr={1} w={6} h={6} />
                      All Listings
                    </Flex>
                  </BreadcrumbLink>
                </NextLink>
              </BreadcrumbItem>

              <BreadcrumbItem>
                <Text color="brand.slate.400"> {bounty?.title}</Text>
              </BreadcrumbItem>
            </Breadcrumb>
          </Box>
          <Flex align="center" justify={'space-between'} mb={4}>
            <Flex align="center" gap={2}>
              <Image
                h={6}
                alt="new project"
                src={'/assets/icons/briefcase.svg'}
              />
              <Text color="brand.slate.800" fontSize="xl" fontWeight="700">
                {bounty?.title}
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Button
                color="brand.slate.400"
                _hover={{ bg: '#E0E7FF', color: '#6366F1' }}
                isLoading={isExporting}
                leftIcon={<DownloadIcon />}
                loadingText={'Exporting...'}
                onClick={() => exportSubmissionsCsv()}
                variant={'ghost'}
              >
                Export CSV
              </Button>
              <Button
                color={'brand.slate.400'}
                _hover={{ bg: '#E0E7FF', color: '#6366F1' }}
                leftIcon={<ExternalLinkIcon />}
                onClick={() =>
                  window.open(
                    `${router.basePath}/listings/bounties/${bounty?.slug}`,
                    '_blank',
                  )
                }
                variant={'ghost'}
              >
                View Listing
              </Button>
              {!bounty?.isWinnersAnnounced && (
                <Button
                  ml={4}
                  color="#6366F1"
                  bg="#E0E7FF"
                  leftIcon={<CheckIcon />}
                  onClick={onOpen}
                  variant={'solid'}
                >
                  Announce Winners
                </Button>
              )}
            </Flex>
          </Flex>
          <Divider />
          <Flex align="center" gap={12} mt={4} mb={8}>
            <Box>
              <Text color="brand.slate.500">Submissions</Text>
              <Text mt={3} color="brand.slate.600" fontWeight={600}>
                {totalSubmissions}
              </Text>
            </Box>
            <Box>
              <Text color="brand.slate.500">Deadline</Text>
              <Text mt={3} color="brand.slate.600" fontWeight={600}>
                {deadline}
              </Text>
            </Box>
            <Box>
              <Text color="brand.slate.500">Status</Text>
              <Tag
                mt={3}
                px={3}
                color={getColorStyles(bountyStatus).color}
                fontSize={'13px'}
                fontWeight={500}
                bg={getColorStyles(bountyStatus).bgColor}
                borderRadius={'full'}
                whiteSpace={'nowrap'}
                variant="solid"
              >
                {bountyStatus}
              </Tag>
            </Box>
            <Box>
              <Text color="brand.slate.500">Prize</Text>
              <Flex align={'center'} justify={'start'} gap={1} mt={3}>
                <Image
                  w={5}
                  h={5}
                  alt={'green dollar'}
                  rounded={'full'}
                  src={
                    tokenList.filter((e) => e?.tokenSymbol === bounty?.token)[0]
                      ?.icon ?? '/assets/icons/green-dollar.svg'
                  }
                />
                <Text color="brand.slate.700" fontWeight={600}>
                  {(bounty?.rewardAmount || 0).toLocaleString('en-US')}
                </Text>
                <Text color="brand.slate.400" fontWeight={600}>
                  {bounty?.token}
                </Text>
              </Flex>
            </Box>
            <Box>
              <Text color="brand.slate.500">Share</Text>
              <InputGroup mt={1} mb={-2}>
                <Input
                  overflow="hidden"
                  w={80}
                  color="brand.slate.500"
                  borderColor="brand.slate.100"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  focusBorderColor="#CFD2D7"
                  isReadOnly
                  value={`${getURL()}t/${bounty?.slug}`}
                />
                <InputRightElement h="100%" mr="1rem">
                  {hasCopied ? (
                    <CheckIcon h="1rem" w="1rem" color="brand.slate.400" />
                  ) : (
                    <CopyIcon
                      onClick={onCopy}
                      cursor="pointer"
                      h="1.3rem"
                      w="1.3rem"
                      color="brand.slate.400"
                    />
                  )}
                </InputRightElement>
              </InputGroup>
            </Box>
          </Flex>
          {!submissions?.length && !searchText ? (
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
            <Flex align={'start'} bg="white">
              <Flex flex="4 1 auto" minH="600px">
                <Box
                  w="70%"
                  bg="white"
                  borderWidth={'1px'}
                  borderColor={'brand.slate.200'}
                  roundedLeft="xl"
                >
                  <Flex
                    align={'center'}
                    justify={'space-between'}
                    gap={4}
                    px={4}
                    py={3}
                    borderBottom={'1px solid'}
                    borderBottomColor="brand.slate.200"
                    cursor="pointer"
                  >
                    <InputGroup w={'full'} size="lg">
                      <Input
                        bg={'white'}
                        borderColor="brand.slate.200"
                        _placeholder={{
                          color: 'brand.slate.400',
                          fontWeight: 500,
                          fontSize: 'md',
                        }}
                        focusBorderColor="brand.purple"
                        onChange={(e) => debouncedSetSearchText(e.target.value)}
                        placeholder="Search Submissions"
                        type="text"
                      />
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="brand.slate.400" />
                      </InputLeftElement>
                    </InputGroup>
                  </Flex>
                  {submissions.map((submission) => {
                    return (
                      <Flex
                        key={submission?.id}
                        align={'center'}
                        justify={'space-between'}
                        gap={4}
                        px={4}
                        py={2}
                        bg={
                          selectedSubmission?.user?.id === submission?.user?.id
                            ? 'brand.slate.100'
                            : 'transparent'
                        }
                        borderBottom={'1px solid'}
                        borderBottomColor="brand.slate.200"
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
                          <Box w={36} ml={2}>
                            <Text
                              overflow={'hidden'}
                              color="brand.slate.700"
                              fontSize="sm"
                              fontWeight={500}
                              whiteSpace="nowrap"
                              textOverflow="ellipsis"
                            >
                              {`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                            </Text>
                            <Text
                              overflow={'hidden'}
                              color="brand.slate.500"
                              fontSize="xs"
                              fontWeight={500}
                              whiteSpace="nowrap"
                              textOverflow="ellipsis"
                            >
                              {submission?.user?.email}
                            </Text>
                          </Box>
                        </Flex>
                        {submission?.isWinner && submission?.winnerPosition && (
                          <Tag w={24} py={1} bg="green.100">
                            <TagLabel
                              w="full"
                              color="green.600"
                              textAlign={'center'}
                              textTransform={'capitalize'}
                            >
                              🏆 {submission?.winnerPosition || 'Winner'}
                            </TagLabel>
                          </Tag>
                        )}
                      </Flex>
                    );
                  })}
                </Box>
                <Box
                  w="150%"
                  bg="white"
                  borderColor="brand.slate.200"
                  borderTopWidth="1px"
                  borderBottomWidth="1px"
                >
                  {submissions.length ? (
                    <>
                      <Flex
                        align="center"
                        justify={'space-between'}
                        w="full"
                        px={4}
                        py={3}
                      >
                        <Text
                          w="100%"
                          color="brand.slate.900"
                          fontSize="lg"
                          fontWeight={500}
                        >
                          {`${selectedSubmission?.user?.firstName}'s Submission`}
                        </Text>
                        <Flex
                          align="center"
                          justify={'flex-end'}
                          gap={2}
                          w="full"
                        >
                          {selectedSubmission?.isWinner &&
                            selectedSubmission?.winnerPosition &&
                            !selectedSubmission?.isPaid &&
                            (bounty?.isWinnersAnnounced ? (
                              <>
                                <DynamicWalletMultiButton
                                  style={{
                                    height: '32px',
                                    fontWeight: 600,
                                    fontFamily: 'Inter',
                                    maxWidth: '96px',
                                    paddingRight: '6px',
                                    paddingLeft: '6px',
                                    fontSize: '10px',
                                  }}
                                >
                                  {connected
                                    ? truncatePublicKey(
                                        publicKey?.toBase58(),
                                        3,
                                      )
                                    : 'Pay'}
                                </DynamicWalletMultiButton>
                                {connected && (
                                  <Button
                                    w="fit-content"
                                    minW={'120px'}
                                    mr={4}
                                    isDisabled={!bounty?.isWinnersAnnounced}
                                    isLoading={isPaying}
                                    loadingText={'Paying...'}
                                    onClick={async () => {
                                      if (!selectedSubmission?.user.publicKey) {
                                        console.error(
                                          'Public key is null, cannot proceed with payment',
                                        );
                                        return;
                                      }
                                      handlePayout({
                                        id: selectedSubmission?.id as string,
                                        token: bounty?.token as string,
                                        amount: bounty?.rewards![
                                          selectedSubmission?.winnerPosition as keyof Rewards
                                        ] as number,
                                        receiver: new PublicKey(
                                          selectedSubmission.user.publicKey,
                                        ),
                                      });
                                    }}
                                    size="sm"
                                    variant="solid"
                                  >
                                    Pay {bounty?.token}{' '}
                                    {!!bounty?.rewards &&
                                      bounty?.rewards[
                                        selectedSubmission?.winnerPosition as keyof Rewards
                                      ]}
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
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
                                size="sm"
                                variant="ghost"
                              >
                                View Payment Txn
                              </Button>
                            )}
                          {isSelectingWinner && (
                            <Spinner color="brand.slate.400" size="sm" />
                          )}
                          {!bounty?.isWinnersAnnounced && (
                            <Tooltip
                              bg={'brand.purple'}
                              hasArrow={true}
                              isDisabled={!bounty?.isWinnersAnnounced}
                              label="You cannot change the winners once the results are published!"
                              placement="top"
                            >
                              <Select
                                minW={48}
                                maxW={48}
                                textTransform="capitalize"
                                borderColor="brand.slate.300"
                                _placeholder={{ color: 'brand.slate.300' }}
                                focusBorderColor="brand.purple"
                                isDisabled={!!bounty?.isWinnersAnnounced}
                                onChange={(e) =>
                                  selectWinner(
                                    e.target.value,
                                    selectedSubmission?.id,
                                  )
                                }
                                value={
                                  selectedSubmission?.isWinner
                                    ? selectedSubmission.winnerPosition || ''
                                    : ''
                                }
                              >
                                <option value={''}>Select Winner</option>
                                {rewards.map((reward) => {
                                  const isRewardUsed =
                                    usedPositions.includes(reward);
                                  const isCurrentSubmissionReward =
                                    selectedSubmission?.winnerPosition ===
                                    reward;
                                  return (
                                    (!isRewardUsed ||
                                      isCurrentSubmissionReward) && (
                                      <option key={reward} value={reward}>
                                        {reward}
                                      </option>
                                    )
                                  );
                                })}
                              </Select>
                            </Tooltip>
                          )}
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
                                as={NextLink}
                                color="brand.purple"
                                wordBreak={'break-all'}
                                href={getURLSanitized(
                                  selectedSubmission?.link || '#',
                                )}
                                isExternal
                              >
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
                                as={NextLink}
                                color="brand.purple"
                                wordBreak={'break-all'}
                                href={getURLSanitized(
                                  selectedSubmission?.tweet || '#',
                                )}
                                isExternal
                              >
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
                            ),
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
                      </Box>
                    </>
                  ) : (
                    <></>
                  )}
                </Box>
                <Box
                  w="70%"
                  bg="white"
                  border="1px solid"
                  borderColor="brand.slate.200"
                  roundedRight={'xl'}
                >
                  {submissions.length ? (
                    <>
                      <Flex
                        justify={'space-around'}
                        direction={'column'}
                        h="100%"
                      >
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
                            <Flex
                              align="center"
                              justify="start"
                              gap={2}
                              fontSize="sm"
                            >
                              <MdOutlineMail color="#94A3B8" />
                              <Text color="brand.slate.400">
                                {selectedSubmission?.user?.email}
                              </Text>
                            </Flex>
                          )}
                          {selectedSubmission?.user?.publicKey && (
                            <Flex
                              align="center"
                              justify="start"
                              gap={2}
                              fontSize="sm"
                            >
                              <MdOutlineAccountBalanceWallet color="#94A3B8" />
                              <Text color="brand.slate.400">
                                {truncatePublicKey(
                                  selectedSubmission?.user?.publicKey,
                                  6,
                                )}
                                <Tooltip
                                  label="Copy Wallet ID"
                                  placement="right"
                                >
                                  <CopyIcon
                                    cursor="pointer"
                                    ml={1}
                                    color="brand.slate.400"
                                    onClick={() =>
                                      navigator.clipboard.writeText(
                                        selectedSubmission?.user?.publicKey ||
                                          '',
                                      )
                                    }
                                  />
                                </Tooltip>
                              </Text>
                            </Flex>
                          )}
                          {selectedSubmission?.user?.discord && (
                            <Flex
                              align="center"
                              justify="start"
                              gap={2}
                              fontSize="sm"
                            >
                              <FaDiscord color="#94A3B8" />

                              <Text color="brand.slate.400">
                                {selectedSubmission?.user?.discord || '-'}
                              </Text>
                            </Flex>
                          )}
                          {selectedSubmission?.user?.twitter && (
                            <Flex
                              align="center"
                              justify="start"
                              gap={2}
                              fontSize="sm"
                            >
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
                            <Flex
                              align="center"
                              justify="start"
                              gap={2}
                              fontSize="sm"
                            >
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
                            <Flex
                              align="center"
                              justify="start"
                              gap={2}
                              fontSize="sm"
                            >
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
                            <Flex
                              align="center"
                              justify="start"
                              gap={2}
                              fontSize="sm"
                            >
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
