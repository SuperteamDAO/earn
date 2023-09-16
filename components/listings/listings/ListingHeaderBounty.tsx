/* eslint-disable no-nested-ternary */
import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import type { BountyType, Regions, SubscribeBounty } from '@prisma/client';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { TbBell, TbBellRinging } from 'react-icons/tb';

import { EarningModal } from '@/components/modals/earningModal';
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
  hackathonPrize?: boolean;
  isTemplate?: boolean;
  region: Regions;
}

function ListingHeader({
  title,
  status,
  deadline,
  sponsor,
  poc,
  type,
  slug,
  isWinnersAnnounced,
  id,
  isTemplate,
  hackathonPrize,
  region,
}: Bounty) {
  const router = useRouter();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { userInfo } = userStore();
  const hasDeadlineEnded = dayjs().isAfter(deadline);
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
      const res = await axios.post('/api/bounties/subscribe/subscribe', {
        userId: userInfo?.id,
        bountyId: id,
      });
      console.log(res);
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
      const res = await axios.post('/api/bounties/subscribe/unSubscribe', {
        id: idSub,
      });
      console.log(res);
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

  return (
    <VStack bg={'white'}>
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
              sponsor?.logo ||
              `${router.basePath}/assets/images/sponsor-logo.png`
            }
          />
          <VStack align={'start'}>
            <HStack>
              <Heading
                color={'brand.charcoal.700'}
                fontFamily={'Inter'}
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
              >
                {(status === 'CLOSED' ||
                  (status === 'OPEN' && isWinnersAnnounced)) && (
                  <Text
                    px={3}
                    py={1}
                    color={'orange.600'}
                    bg={'orange.100'}
                    rounded={'full'}
                  >
                    Submissions Closed
                  </Text>
                )}
                {!isWinnersAnnounced &&
                  hasDeadlineEnded &&
                  status === 'OPEN' && (
                    <Text
                      px={3}
                      py={1}
                      color={'orange.600'}
                      bg={'orange.100'}
                      rounded={'full'}
                    >
                      Submissions In Review
                    </Text>
                  )}
                {!hasDeadlineEnded && status === 'OPEN' && (
                  <Text
                    px={3}
                    py={1}
                    color={'green.600'}
                    bg={'green.100'}
                    rounded={'full'}
                  >
                    Submissions Open
                  </Text>
                )}
              </Flex>
            </HStack>
            {!isTemplate && (
              <HStack>
                <Text color={'#94A3B8'} fontWeight={500}>
                  by {poc?.firstName} at {sponsor?.name}
                </Text>
                <Text color={'#E2E8EF'} fontWeight={500}>
                  |
                </Text>
                <Flex
                  align={'center'}
                  gap={1}
                  display={{ base: 'none', md: 'flex' }}
                >
                  <Text color={'#94A3B8'}>
                    {hackathonPrize
                      ? 'Hackathon Prize'
                      : type === 'permissioned'
                      ? 'Application-based Bounty'
                      : 'Open Bounty'}
                  </Text>
                  {!hackathonPrize && (
                    <Tooltip
                      px={4}
                      py={2}
                      color={'#94A3B8'}
                      fontFamily={'Inter'}
                      fontSize="sm"
                      bg="white"
                      borderRadius={'lg'}
                      label={
                        type === 'permissioned'
                          ? "Don't start working just yet! Apply first, and then you'll be notified if you're selected to work on this bounty."
                          : 'This is an open competition bounty! Anyone can start working and submit their work before the deadline!'
                      }
                      placement="right"
                    >
                      <InfoOutlineIcon boxSize={4} color={'#94A3B8'} mr={3} />
                    </Tooltip>
                  )}
                </Flex>
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
            {(status === 'CLOSED' ||
              (status === 'OPEN' && isWinnersAnnounced)) && (
              <Text
                px={3}
                py={1}
                color={'orange.600'}
                bg={'orange.100'}
                rounded={'full'}
              >
                Submissions Closed
              </Text>
            )}
            {!isWinnersAnnounced && hasDeadlineEnded && status === 'OPEN' && (
              <Text
                px={3}
                py={1}
                color={'orange.600'}
                bg={'orange.100'}
                rounded={'full'}
              >
                In Review
              </Text>
            )}
            {!hasDeadlineEnded && status === 'OPEN' && (
              <Text
                px={3}
                py={1}
                color={'green.600'}
                bg={'green.100'}
                rounded={'full'}
              >
                Submissions Open
              </Text>
            )}
          </Flex>
          <Flex align={'center'} gap={1} display={{ base: 'flex', md: 'none' }}>
            <Text color={'#94A3B8'} fontSize="sm">
              {type === 'permissioned'
                ? 'Application-based Bounty'
                : 'Open Bounty'}
            </Text>
            <Popover>
              <PopoverTrigger>
                <InfoOutlineIcon boxSize={4} color={'#94A3B8'} mr={3} />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverBody>
                  {type === 'permissioned'
                    ? "Don't start working just yet! Apply first, and then you'll be notified if you're selected to work on this bounty."
                    : 'This is an open competition bounty! Anyone can start working and submit their work before the deadline!'}
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Flex>
        </Flex>
        {router.asPath.includes('bounties') && !isTemplate && (
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
                      sub.find((e) => e.userId === userInfo?.id)?.id as string
                    );

                    return;
                  }
                  handleSubscribe();
                }}
                variant="solid"
              />
            </HStack>
            <HStack>
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
      {router.asPath.includes('bounties') && !isTemplate && (
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
              alignItems="center"
              justifyContent="center"
              display="flex"
              h={'full'}
              color="gray.800"
              fontWeight={500}
              textDecoration="none"
              borderBottom="2px solid"
              borderBottomColor={
                !router.asPath.includes('submission')
                  ? 'brand.purple'
                  : 'transparent'
              }
              _hover={{
                textDecoration: 'none',
                borderBottom: '2px solid',
                borderBottomColor: 'brand.purple',
              }}
              href={`/listings/bounties/${slug}`}
            >
              Details
            </Link>
            {type !== 'permissioned' && (
              <Link
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
                href={`/listings/bounties/${slug}/submission`}
              >
                Submissions
              </Link>
            )}
          </HStack>
        </Flex>
      )}
    </VStack>
  );
}

export default ListingHeader;
