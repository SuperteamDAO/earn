import { ExternalLinkIcon, WarningIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  HStack,
  Image,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { tokenList } from '@/constants/index';
import { type ParentSkills } from '@/interface/skills';
import { dayjs } from '@/utils/dayjs';
import { getURLSanitized } from '@/utils/getURLSanitized';

import type { Listing } from '../../types';
import { SubmissionActionButton } from '../Submission/SubmissionActionButton';
import { CompensationAmount } from './CompensationAmount';
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

  const [isSubmissionNumberLoading, setIsSubmissionNumberLoading] =
    useState(true);
  const [submissionNumber, setSubmissionNumber] = useState(0);
  const [submissionRange, setSubmissionRange] = useState('');

  const hasHackathonStarted = Hackathon?.startDate
    ? dayjs().isAfter(Hackathon.startDate)
    : true;

  const getSubmissionsCount = async () => {
    setIsSubmissionNumberLoading(true);
    try {
      const submissionCountDetails = await axios.get(
        `/api/listings/${id}/submission-count/`,
      );
      const count = submissionCountDetails?.data || 0;
      setSubmissionNumber(count);
      if (count >= 0 && count <= 10) {
        setSubmissionRange('0-10');
      } else if (count > 10 && count <= 25) {
        setSubmissionRange('10-25');
      } else if (count > 25 && count <= 50) {
        setSubmissionRange('25-50');
      } else if (count > 50 && count <= 100) {
        setSubmissionRange('50-100');
      } else if (count > 100) {
        setSubmissionRange('100+');
      }
      setIsSubmissionNumberLoading(false);
    } catch (e) {
      setIsSubmissionNumberLoading(false);
    }
  };

  useEffect(() => {
    if (!isSubmissionNumberLoading) return;
    getSubmissionsCount();
  }, []);

  const isProject = type === 'project';

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
          <VStack justify={'space-between'} w={'full'} pb={4}>
            <TableContainer w={'full'}>
              {compensationType !== 'fixed' && (
                <Text
                  px={6}
                  pb={2}
                  color="brand.slate.400"
                  fontSize={'xs'}
                  fontWeight={500}
                >
                  {compensationType === 'range' && 'Budget'}
                  {compensationType === 'variable' && 'Payment in'}
                </Text>
              )}
              <Table variant={'unstyled'}>
                <Tbody>
                  <Tr w={'full'}>
                    <Td w="full" py={0} colSpan={3}>
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
                            w: '8.5rem',
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
                          <Td colSpan={3}>
                            <PrizesList
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
            w="90%"
            borderColor={'brand.slate.100'}
            borderBottom={'1px solid '}
          />
          <Flex
            justify={'space-between'}
            w={'full'}
            px={5}
            py={!rewards ? 3 : 0}
          >
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
                          ? submissionNumber.toLocaleString()
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

          <Box w="full" px={5}>
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
              submissionNumber={submissionNumber}
              setSubmissionNumber={setSubmissionNumber}
            />
            {isProject && (
              <Flex gap="2" w="20rem" mt={-1} mb={4} p="3" bg={'#62F6FF10'}>
                <WarningIcon color="#1A7F86" />
                <Text color="#1A7F86" fontSize={'xs'} fontWeight={500}>
                  Don&apos;t start working just yet! Apply first, and then begin
                  working only once you&apos;ve been hired for the project.
                </Text>
              </Flex>
            )}
          </Box>
          <Box display={{ base: 'none', md: 'block' }}>
            <ExtraInfoSection skills={skills} listing={listing} />
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
}

interface ExtraInfoSectionProps {
  skills?: ParentSkills[];
  listing: Listing;
}
export function ExtraInfoSection({ skills, listing }: ExtraInfoSectionProps) {
  const { requirements, pocSocials, Hackathon } = listing;

  const posthog = usePostHog();
  return (
    <VStack gap={8} w={{ base: 'full', md: '22rem' }} px={6} pt={2}>
      <VStack align={'start'} w="full">
        <Text
          h="100%"
          color={'brand.slate.600'}
          fontSize={'sm'}
          fontWeight={600}
          textAlign="center"
        >
          SKILLS NEEDED
        </Text>
        <HStack flexWrap={'wrap'} gap={3}>
          {skills?.map((skill) => (
            <Box
              key={skill}
              m={'0px !important'}
              px={4}
              py={1}
              color="#475569"
              fontSize="sm"
              fontWeight={500}
              bg={'#F1F5F9'}
              rounded={'sm'}
            >
              <Text fontSize={'xs'}>{skill}</Text>
            </Box>
          ))}
        </HStack>
      </VStack>
      <VStack align={'start'} w="full" fontSize={'sm'}>
        <Text color={'brand.slate.600'} fontWeight={600}>
          {listing.region}
        </Text>
        <Text h="100%" color={'brand.slate.500'}>
          {listing.region === 'GLOBAL'
            ? 'This listing is open for all people in all regions of the world'
            : `This listing is only open for people in ${listing.region}`}
        </Text>
      </VStack>
      {Hackathon && (
        <VStack align={'start'} w="full" fontSize="sm">
          <Text color={'brand.slate.600'} fontWeight={600}>
            {Hackathon.name.toUpperCase()} TRACK
          </Text>
          <Text color={'brand.slate.500'}>{Hackathon.description}</Text>
          <Link
            color={'brand.slate.500'}
            fontWeight={500}
            href={`/${Hackathon.name.toLowerCase()}`}
            isExternal
          >
            View All Challenges
          </Link>
        </VStack>
      )}
      {requirements && (
        <VStack align={'start'} w={'full'} fontSize="sm">
          <Text h="100%" color={'brand.slate.600'} fontWeight={600}>
            ELIGIBILITY
          </Text>
          <Text color={'brand.slate.500'}>{requirements}</Text>
        </VStack>
      )}
      {pocSocials && (
        <VStack align={'start'} w={'full'} fontSize="sm">
          <Text
            h="100%"
            color={'brand.slate.600'}
            fontWeight={600}
            textAlign="center"
          >
            CONTACT
          </Text>
          <Text>
            <Link
              className="ph-no-capture"
              color={'#64768b'}
              fontWeight={500}
              href={getURLSanitized(pocSocials)}
              isExternal
              onClick={() => posthog.capture('reach out_listing')}
            >
              Reach out
              <ExternalLinkIcon color={'#64768b'} mb={1} as="span" mx={1} />
            </Link>
            <Text as="span" color={'brand.slate.500'}>
              if you have any questions about this listing
            </Text>
          </Text>
        </VStack>
      )}
    </VStack>
  );
}
