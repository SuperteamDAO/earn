import { WarningIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  Image,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { exclusiveSponsorData, tokenList } from '@/constants/index';
import { RelatedListings } from '@/features/home';
import { type ParentSkills } from '@/interface/skills';
import { cn } from '@/utils';
import { dayjs } from '@/utils/dayjs';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { cleanRewardPrizes } from '@/utils/rank';

import { submissionCountQuery } from '../../queries';
import type { Listing } from '../../types';
import { SubmissionActionButton } from '../Submission/SubmissionActionButton';
import { CompensationAmount } from './CompensationAmount';
import { ExtraInfoSection } from './ExtraInfoSection';
import { ListingWinners } from './ListingWinners';
import { PrizesList } from './PrizesList';

function digitsInLargestString(numbers: string[]): number {
  const largest = numbers.reduce((max, current) => {
    const cleanedCurrent = current.replace(/[,\.]/g, '');
    const cleanedMax = max.replace(/[,\.]/g, '');

    return cleanedCurrent.length > cleanedMax.length
      ? current
      : cleanedCurrent.length === cleanedMax.length &&
          cleanedCurrent > cleanedMax
        ? current
        : max;
  }, '');

  return largest.replace(/[,\.]/g, '').length;
}

export function RightSideBar({
  listing,
  skills,
  isTemplate = false,
}: {
  listing: Listing;
  skills?: ParentSkills[];
  isTemplate?: boolean;
}) {
  const {
    id,
    token,
    type,
    deadline,
    rewards,
    rewardAmount,
    compensationType,
    maxRewardAsk,
    minRewardAsk,
    Hackathon,
    timeToComplete,
    maxBonusSpots,
  } = listing;

  const { data: submissionNumber, isLoading: isSubmissionNumberLoading } =
    useQuery(submissionCountQuery(id!));

  const [submissionRange, setSubmissionRange] = useState('');

  const hasHackathonStarted = Hackathon?.startDate
    ? dayjs().isAfter(Hackathon.startDate)
    : true;

  useEffect(() => {
    if (submissionNumber !== undefined) {
      if (submissionNumber >= 0 && submissionNumber <= 10) {
        setSubmissionRange('0-10');
      } else if (submissionNumber > 10 && submissionNumber <= 25) {
        setSubmissionRange('10-25');
      } else if (submissionNumber > 25 && submissionNumber <= 50) {
        setSubmissionRange('25-50');
      } else if (submissionNumber > 50 && submissionNumber <= 100) {
        setSubmissionRange('50-100');
      } else if (submissionNumber > 100 && submissionNumber <= 200) {
        setSubmissionRange('100-200');
      } else if (submissionNumber > 200 && submissionNumber <= 300) {
        setSubmissionRange('200-300');
      } else if (submissionNumber > 300) {
        setSubmissionRange('300+');
      }
    }
  }, [submissionNumber]);

  const isProject = type === 'project';

  const router = useRouter();

  const consideringDigitsArray = cleanRewardPrizes(rewards).map(
    (c) => formatNumberWithSuffix(c, 2, true) + (token || '') + '',
  );

  consideringDigitsArray.push(
    formatNumberWithSuffix(rewardAmount || 0, 2, true) + (token || '') + '',
  );
  const largestDigits = digitsInLargestString(consideringDigitsArray);

  let widthOfPrize = largestDigits - 0.75 + 'rem';
  if (cleanRewardPrizes(rewards).length > 6) {
    widthOfPrize = largestDigits + 0.5 + 'rem';
  }
  if (compensationType === 'range') {
    widthOfPrize = '90%';
  }

  return (
    <Box w={{ base: 'full', md: 'auto' }} h="full">
      <VStack gap={2} w="full" pt={4}>
        <VStack
          justify={'center'}
          gap={0}
          w="full"
          bg={'#FFFFFF'}
          rounded={'xl'}
        >
          {!router.asPath.split('/')[4]?.includes('submission') &&
            !router.asPath.split('/')[4]?.includes('references') &&
            listing.isWinnersAnnounced && (
              <Box display={{ base: 'block', md: 'none' }} w="full" pb={6}>
                <ListingWinners bounty={listing} />
              </Box>
            )}
          <VStack justify={'space-between'} w={'full'} px={1} pb={4}>
            <TableContainer w={'full'}>
              <Table variant={'unstyled'}>
                <Tbody>
                  <Tr w={'full'}>
                    <Td w="full" px={0} py={0} colSpan={3}>
                      <Flex align="center" gap={2}>
                        <Image
                          w={8}
                          h={8}
                          alt={'green doller'}
                          rounded={'full'}
                          src={
                            tokenList.filter((e) => e?.tokenSymbol === token)[0]
                              ?.icon ?? '/assets/icons/green-dollar.svg'
                          }
                        />
                        <CompensationAmount
                          compensationType={compensationType}
                          rewardAmount={rewardAmount}
                          maxRewardAsk={maxRewardAsk}
                          minRewardAsk={minRewardAsk}
                          token={token}
                          className={cn(
                            'text-lg font-semibold text-slate-700 md:text-xl',
                            widthOfPrize && `w-[${widthOfPrize}]`,
                          )}
                        />
                        <Text
                          color={'brand.slate.500'}
                          fontSize={'lg'}
                          fontWeight={400}
                        >
                          {isProject ? 'Payment' : 'Total Prizes'}
                        </Text>
                      </Flex>
                    </Td>
                  </Tr>
                  {!isProject && (
                    <>
                      {rewards && (
                        <Tr>
                          <Td px={0} colSpan={3}>
                            <PrizesList
                              widthPrize={widthOfPrize}
                              totalReward={rewardAmount ?? 0}
                              maxBonusSpots={maxBonusSpots ?? 0}
                              token={token ?? ''}
                              rewards={rewards}
                            />
                          </Td>
                        </Tr>
                      )}
                    </>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </VStack>
          <Box
            w="100%"
            borderColor={'brand.slate.100'}
            borderBottomWidth={'1px'}
          />
          <Flex justify={'space-between'} w={'full'} py={!rewards ? 3 : 0}>
            {hasHackathonStarted ? (
              <>
                <Flex align={'start'} justify={'center'} direction={'column'}>
                  <Flex align={'center'} justify={'center'} gap={2}>
                    <Image
                      w={'1.4rem'}
                      mt={-1}
                      alt={'suit case'}
                      src={'/assets/icons/purple-suitcase.svg'}
                    />
                    <Text
                      color={'#000000'}
                      fontSize={{ base: 'lg', md: 'xl' }}
                      fontWeight={500}
                    >
                      {isSubmissionNumberLoading
                        ? '...'
                        : !isProject
                          ? submissionNumber?.toLocaleString('en-us')
                          : submissionRange}
                    </Text>
                  </Flex>
                  <Text color={'#94A3B8'}>
                    {isProject
                      ? 'Applications'
                      : submissionNumber === 1
                        ? 'Submission'
                        : 'Submissions'}
                  </Text>
                </Flex>

                <Flex
                  align={'start'}
                  justify={'center'}
                  direction={'column'}
                  py={3}
                >
                  <Flex align={'start'} justify={'center'} gap={1}>
                    <Image
                      w={'1.4rem'}
                      mt={1}
                      alt={'suit case'}
                      src={'/assets/icons/purple-timer.svg'}
                    />
                    <VStack align={'start'} gap={0}>
                      <Text
                        color={'#000000'}
                        fontSize={{ base: 'lg', md: 'xl' }}
                        fontWeight={500}
                      >
                        <Countdown
                          date={deadline}
                          renderer={CountDownRenderer}
                          zeroPadDays={1}
                        />
                      </Text>
                      <Text color={'#94A3B8'}>Remaining</Text>
                    </VStack>
                  </Flex>
                </Flex>
              </>
            ) : (
              <Flex
                align={'start'}
                justify={'center'}
                direction={'column'}
                py={3}
              >
                <Flex align={'start'} justify={'center'} gap={1}>
                  <Image
                    w={'1.4rem'}
                    mt={1}
                    alt={'suit case'}
                    src={'/assets/icons/purple-timer.svg'}
                  />
                  <VStack align={'start'} gap={0}>
                    <Text
                      color={'#000000'}
                      fontSize={{ base: 'lg', md: 'xl' }}
                      fontWeight={500}
                    >
                      <Countdown
                        date={Hackathon?.startDate}
                        renderer={CountDownRenderer}
                        zeroPadDays={1}
                      />
                    </Text>
                    <Text color={'#94A3B8'}>Until Submissions Open</Text>
                  </VStack>
                </Flex>
              </Flex>
            )}
          </Flex>

          <Box w="full">
            {isProject && (
              <Flex align={'start'} direction={'column'} my={4}>
                <Text
                  color={'#000000'}
                  fontSize={{ base: 'lg', md: 'xl' }}
                  fontWeight={500}
                >
                  {timeToComplete}
                </Text>
                <Text color={'#94A3B8'}>Time to Complete</Text>
              </Flex>
            )}
            <SubmissionActionButton listing={listing} isTemplate={isTemplate} />
            {isProject && deadline && dayjs(deadline).isAfter(new Date()) && (
              <Flex gap="2" w="full" mt={-1} mb={4} p="3" bg={'#62F6FF10'}>
                <WarningIcon color="#1A7F86" />
                <Text color="#1A7F86" fontSize={'xs'} fontWeight={500}>
                  Don&apos;t start working just yet! Apply first, and then begin
                  working only once you&apos;ve been hired for the project.
                </Text>
              </Flex>
            )}
          </Box>
          <Box w="full">
            <ExtraInfoSection
              skills={skills}
              region={listing.region}
              requirements={listing.requirements}
              pocSocials={listing.pocSocials}
              Hackathon={listing.Hackathon}
            />
          </Box>
          <Box
            display={{ base: 'none', md: 'block' }}
            w={'full'}
            py={8}
            fontSize="sm"
          >
            {listing.id && (
              <RelatedListings
                isHackathon={!!listing.hackathonId}
                listingId={listing.id}
                excludeIds={listing.id ? [listing.id] : undefined}
                exclusiveSponsorId={
                  Object.values(exclusiveSponsorData).some(
                    (sponsor) => sponsor.title === listing?.sponsor?.name,
                  )
                    ? listing?.sponsorId
                    : undefined
                }
              >
                <Flex align="center" justify={'space-between'} w="full">
                  <Text
                    color={'brand.slate.600'}
                    fontSize={'sm'}
                    fontWeight={600}
                  >
                    {!Hackathon
                      ? 'RELATED LIVE LISTINGS'
                      : 'RELATED LIVE TRACKS'}
                  </Text>
                </Flex>
              </RelatedListings>
            )}
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
}
