import {
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Link,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import type { BountyType, Regions, SubscribeBounty } from '@prisma/client';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { TbBell, TbBellRinging } from 'react-icons/tb';

import { EarningModal } from '@/components/modals/earningModal';
import type { References } from '@/interface/bounty';
import type { SponsorType } from '@/interface/sponsor';
import type { User } from '@/interface/user';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

interface Bounty {
  id: string | undefined;
  title: string;
  deadline?: string;
  status?: 'OPEN' | 'REVIEW' | 'CLOSED';
  isActive?: boolean;
  isPublished?: string;
  isFeatured?: string;
  sponsor?: SponsorType | undefined;
  poc?: User;
  slug?: string;
  type?: BountyType | string;
  isWinnersAnnounced?: boolean;
  hackathonLogo?: string;
  hackathonStartsAt?: string;
  isTemplate?: boolean;
  region: Regions;
  references?: References[];
}

export function ListingHeader({
  title,
  status,
  deadline,
  sponsor,
  type,
  slug,
  isWinnersAnnounced,
  id,
  isTemplate,
  hackathonLogo,
  hackathonStartsAt,
  region,
  references,
}: Bounty) {
  const router = useRouter();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { userInfo } = userStore();
  const hasDeadlineEnded = dayjs().isAfter(deadline);
  const hasHackathonStarted = dayjs().isAfter(hackathonStartsAt);
  const [update, setUpdate] = useState<boolean>(false);
  const [sub, setSub] = useState<
    (SubscribeBounty & {
      User: User | null;
    })[]
  >([]);
  const handleSubscribe = async () => {
    if (!userInfo?.isTalentFilled) {
      onOpen();
      return;
    }

    try {
      await axios.post('/api/bounties/subscribe/subscribe', {
        bountyId: id,
      });
      setUpdate((prev) => !prev);
      toast.success('Subscribed to bounty');
    } catch (error) {
      console.log(error);
      toast.error('Error');
    }
  };
  const handleUnSubscribe = async (idSub: string) => {
    if (!userInfo?.isTalentFilled) {
      onOpen();
      return;
    }

    try {
      await axios.post('/api/bounties/subscribe/unSubscribe', {
        id: idSub,
      });
      setUpdate((prev) => !prev);
      toast.success('Unsubscribe to bounty');
    } catch (error) {
      console.log(error);
      toast.error('Error');
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await axios.post('/api/bounties/subscribe/get', {
        listingId: id,
      });
      setSub(data);
    };
    fetchUser();
  }, [update]);

  const isProject = type === 'project';
  const isHackathon = type === 'hackathon';

  let statusText = '';
  let statusBgColor = '';
  let statusTextColor = '';

  if (isHackathon && !hasDeadlineEnded && !hasHackathonStarted) {
    statusText = 'Open';
    statusBgColor = 'green.100';
    statusTextColor = 'green.600';
  } else if (status === 'CLOSED' || (status === 'OPEN' && isWinnersAnnounced)) {
    statusText = 'Submissions Closed';
    statusBgColor = 'orange.100';
    statusTextColor = 'orange.600';
  } else if (!isWinnersAnnounced && hasDeadlineEnded && status === 'OPEN') {
    statusText = 'Submissions In Review';
    statusBgColor = 'orange.100';
    statusTextColor = 'orange.600';
  } else if (!hasDeadlineEnded && !isWinnersAnnounced && status === 'OPEN') {
    statusText = 'Submissions Open';
    statusBgColor = 'green.100';
    statusTextColor = 'green.600';
  }

  return (
    <VStack px={{ base: '2', md: '6' }} bg={'white'}>
      {isOpen && <EarningModal isOpen={isOpen} onClose={onClose} />}
      <VStack
        align="start"
        justify={['start', 'start', 'space-between', 'space-between']}
        flexDir={['column', 'column', 'row', 'row']}
        gap={5}
        w={'full'}
        maxW={'7xl'}
        mx={'auto'}
        py={10}
      >
        <HStack align="center" px={[3, 3, 0, 0]}>
          <Image
            w={'4rem'}
            h={'4rem'}
            objectFit={'cover'}
            alt={'phantom'}
            rounded={'md'}
            src={
              sponsor?.logo || `${router.basePath}/assets/logo/sponsor-logo.png`
            }
          />
          <VStack align={'start'}>
            <HStack>
              <Heading
                color={'brand.charcoal.700'}
                fontFamily={'var(--font-sans)'}
                fontSize={{ base: 'lg', md: 'xl' }}
                fontWeight={{ base: 600, md: 700 }}
              >
                {title}
              </Heading>
              <Flex
                display={{ base: 'none', md: 'flex' }}
                fontSize={'xs'}
                fontWeight={500}
                bg={'green.100'}
                borderRadius={'full'}
                whiteSpace={'nowrap'}
              >
                {statusText && (
                  <Text
                    px={3}
                    py={1}
                    color={statusTextColor}
                    bg={statusBgColor}
                    rounded={'full'}
                  >
                    {statusText}
                  </Text>
                )}
              </Flex>
            </HStack>
            {!isTemplate && (
              <HStack>
                <Text color={'#94A3B8'} fontWeight={500}>
                  by {sponsor?.name}
                </Text>
                <Text color={'#E2E8EF'} fontWeight={500}>
                  |
                </Text>
                {isHackathon ? (
                  <Flex align={'center'}>
                    <Image h="6" alt={type} src={hackathonLogo} />
                  </Flex>
                ) : (
                  <>
                    <Flex
                      align={'center'}
                      gap={1}
                      display={{ base: 'none', md: 'flex' }}
                    >
                      <Text color={'gray.400'} fontWeight={500}>
                        <Tooltip
                          px={4}
                          py={2}
                          color="brand.slate.500"
                          fontFamily={'var(--font-sans)'}
                          fontSize="sm"
                          bg="white"
                          borderRadius={'lg'}
                          label={
                            isProject
                              ? 'A Project is a short-term gig where sponsors solicit applications from multiple people, and select the best one to work on the Project.'
                              : 'Bounties are open for anyone to participate in and submit their work (as long as they meet the eligibility requirements mentioned below). The best submissions win!'
                          }
                        >
                          <Flex>
                            <Image
                              h="4"
                              mt={1}
                              mr={1}
                              alt={type}
                              src={
                                isProject
                                  ? '/assets/icons/briefcase.svg'
                                  : '/assets/icons/bolt.svg'
                              }
                            />
                            {isProject ? 'Project' : 'Bounty'}
                          </Flex>
                        </Tooltip>
                      </Text>
                    </Flex>
                    <Tooltip
                      px={4}
                      py={2}
                      color="brand.slate.500"
                      fontFamily={'Inter'}
                      fontSize="sm"
                      bg="white"
                      borderRadius={'lg'}
                      label={
                        region === 'GLOBAL'
                          ? 'This listing is open to everyone in the world!'
                          : `You need to be a resident of ${
                              region.charAt(0).toUpperCase() +
                              region.slice(1).toLowerCase()
                            } to participate in this bounty`
                      }
                    >
                      <Text
                        px={2}
                        py={1}
                        color={'#0800A5'}
                        fontSize={'xs'}
                        fontWeight={500}
                        bg="#EBEAFF"
                        rounded={'full'}
                      >
                        {region}
                      </Text>
                    </Tooltip>
                  </>
                )}
              </HStack>
            )}
          </VStack>
        </HStack>
        <Flex gap={3}>
          <Flex
            display={{ base: 'flex', md: 'none' }}
            ml={3}
            fontSize={'xs'}
            fontWeight={500}
            bg={'green.100'}
            rounded={'full'}
          >
            {statusText && (
              <Text
                px={3}
                py={1}
                color={statusTextColor}
                bg={statusBgColor}
                rounded={'full'}
              >
                {statusText}
              </Text>
            )}
          </Flex>
          <Flex align={'center'} gap={1} display={{ base: 'flex', md: 'none' }}>
            <Tooltip
              px={4}
              py={2}
              color={'#94A3B8'}
              fontFamily={'var(--font-sans)'}
              fontSize="sm"
              bg="white"
              borderRadius={'lg'}
              label={
                isProject
                  ? 'Projects are like short-term freelance gigs that you can apply for. If and when selected as the winner, you can begin executing the scope of work mentioned in this listing.'
                  : 'This is an open competition bounty! Anyone can start working and submit their work before the deadline!'
              }
            >
              <Flex>
                <Image
                  h="4"
                  mt={1}
                  mr={1}
                  alt={type}
                  src={
                    isProject
                      ? '/assets/icons/briefcase.svg'
                      : '/assets/icons/bolt.svg'
                  }
                />
                <Text color="gray.400" fontWeight={500}>
                  {isProject ? 'Project' : 'Bounty'}
                </Text>
              </Flex>
            </Tooltip>
          </Flex>
        </Flex>
        {!isTemplate && (
          <HStack>
            <HStack align="start" px={[3, 3, 0, 0]}>
              <IconButton
                aria-label="Notify"
                icon={
                  sub.find((e) => e.userId === userInfo?.id) ? (
                    <TbBellRinging />
                  ) : (
                    <TbBell />
                  )
                }
                onClick={() => {
                  if (sub.find((e) => e.userId === userInfo?.id)) {
                    handleUnSubscribe(
                      sub.find((e) => e.userId === userInfo?.id)?.id as string,
                    );

                    return;
                  }
                  handleSubscribe();
                }}
                variant="solid"
              />
            </HStack>
            <HStack whiteSpace={'nowrap'}>
              <VStack align={'start'} gap={0}>
                <Text color={'#000000'} fontSize={'md'} fontWeight={500}>
                  {sub?.length ? sub.length + 1 : 1}
                </Text>
                <Text
                  mt={'0px !important'}
                  color={'gray.500'}
                  fontSize={'md'}
                  fontWeight={500}
                >
                  {(sub?.length ? sub.length + 1 : 1) === 1
                    ? 'Person'
                    : 'People'}{' '}
                  Interested
                </Text>
              </VStack>
            </HStack>
          </HStack>
        )}
      </VStack>
      <Toaster />
      {!isTemplate && (
        <Flex
          align={'center'}
          w={'full'}
          h={10}
          borderTop={'1px solid'}
          borderTopColor={'gray.100'}
        >
          <HStack
            align="center"
            justifyContent="start"
            gap={10}
            w={'full'}
            maxW={'7xl'}
            h={'full'}
            mx={'auto'}
            my={'auto'}
            px={3}
          >
            <Link
              as={NextLink}
              alignItems="center"
              justifyContent="center"
              display="flex"
              h={'full'}
              color="gray.800"
              fontWeight={500}
              textDecoration="none"
              borderBottom="2px solid"
              borderBottomColor={
                !router.asPath.includes('submission') &&
                !router.asPath.includes('references')
                  ? 'brand.purple'
                  : 'transparent'
              }
              _hover={{
                textDecoration: 'none',
                borderBottom: '2px solid',
                borderBottomColor: 'brand.purple',
              }}
              href={`/listings/${type}/${slug}/`}
            >
              Details
            </Link>
            {!isProject && hasDeadlineEnded && (
              <Link
                as={NextLink}
                alignItems="center"
                justifyContent="center"
                display="flex"
                h={'full'}
                color="gray.800"
                fontWeight={500}
                textDecoration="none"
                borderBottom="2px solid"
                borderBottomColor={
                  router.asPath.includes('submission')
                    ? 'brand.purple'
                    : 'transparent'
                }
                _hover={{
                  textDecoration: 'none',
                  borderBottom: '2px solid',
                  borderBottomColor: 'brand.purple',
                }}
                href={`/listings/${type}/${slug}/submission`}
              >
                Submissions
              </Link>
            )}
            {isProject && references && references?.length > 0 && (
              <Link
                as={NextLink}
                alignItems="center"
                justifyContent="center"
                display="flex"
                h={'full'}
                color="gray.800"
                fontWeight={500}
                textDecoration="none"
                borderBottom="2px solid"
                borderBottomColor={
                  router.asPath.includes('references')
                    ? 'brand.purple'
                    : 'transparent'
                }
                _hover={{
                  textDecoration: 'none',
                  borderBottom: '2px solid',
                  borderBottomColor: 'brand.purple',
                }}
                href={`/listings/${type}/${slug}/references`}
              >
                References
              </Link>
            )}
          </HStack>
        </Flex>
      )}
    </VStack>
  );
}
