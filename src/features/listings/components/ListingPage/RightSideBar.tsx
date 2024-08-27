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
import { tokenList } from '@/constants/index';
import { LiveListings } from '@/features/home';
import { type ParentSkills } from '@/interface/skills';
import { dayjs } from '@/utils/dayjs';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { cleanRewardPrizes } from '@/utils/rank';

import { submissionCountQuery } from '../../queries';
import type { Listing } from '../../types';
import { digitsInLargestString } from '../../utils';
import { SubmissionActionButton } from '../Submission/SubmissionActionButton';
import { CompensationAmount } from './CompensationAmount';
import { ExtraInfoSection } from './ExtraInfoSection';
import { ListingWinners } from './ListingWinners';
import { PrizesList } from './PrizesList';

export function RightSideBar({
  listing,
  skills,
}: {
  listing: Listing;
  skills?: ParentSkills[];
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
    applicationType,
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
      } else if (submissionNumber > 100) {
        setSubmissionRange('100+');
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
                          textStyle={{
                            fontWeight: 600,
                            fontSize: { base: 'lg', md: 'xl' },
                            color: 'brand.slate.700',
                            w: widthOfPrize,
                          }}
                        />
                        {!isProject && (
                          <Text
                            color={'brand.slate.500'}
                            fontSize={'lg'}
                            fontWeight={400}
                          >
                            Total Prizes
                          </Text>
                        )}
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
                          ? submissionNumber?.toLocaleString()
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
                        {applicationType === 'fixed' ? (
                          <Countdown
                            date={deadline}
                            renderer={CountDownRenderer}
                            zeroPadDays={1}
                          />
                        ) : (
                          'Rolling'
                        )}
                      </Text>
                      <Text color={'#94A3B8'}>
                        {applicationType === 'fixed' ? 'Remaining' : 'Deadline'}
                      </Text>
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
            <SubmissionActionButton
              listing={listing}
              hasHackathonStarted={hasHackathonStarted}
            />
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
          <Box display={{ base: 'none', md: 'block' }} w="full" pt={8}>
            <LiveListings excludeIds={listing.id ? [listing.id] : undefined}>
              <Text
                h="100%"
                color={'brand.slate.600'}
                fontSize={'sm'}
                fontWeight={600}
                textAlign="start"
              >
                LIVE LISTINGS
              </Text>
            </LiveListings>
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
}
