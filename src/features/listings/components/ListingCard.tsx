import { Box, Circle, Flex, Image, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { IoIosStar } from 'react-icons/io';
import { MdModeComment } from 'react-icons/md';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { tokenList } from '@/constants';
import { dayjs } from '@/utils/dayjs';
import { timeAgoShort } from '@/utils/timeAgo';

import { type Listing } from '../types';
import { getListingIcon } from '../utils';
import { CompensationAmount } from './ListingPage/CompensationAmount';

export const ListingCardSkeleton = () => {
  return (
    <div className="rounded-md px-1 py-4 sm:px-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex h-14 w-full sm:h-16">
          <Skeleton className="mr-3 h-14 w-[4.2rem] rounded-md sm:mr-5 sm:h-16 sm:w-[4.6rem]" />
          <div className="flex w-full flex-col justify-between">
            <Skeleton className="h-3.5 w-[60%]" />
            <Skeleton className="h-3 w-[130px]" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-[56px]" />
              <Skeleton className="h-3 w-[48px]" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-[14px] w-[54px]" />
        </div>
      </div>
    </div>
  );
};

export const ListingCard = ({ bounty }: { bounty: Listing }) => {
  const {
    rewardAmount,
    deadline,
    type,
    sponsor,
    title,
    token,
    slug,
    isWinnersAnnounced,
    isFeatured,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
    winnersAnnouncedAt,
    _count,
  } = bounty;

  const router = useRouter();
  const isBounty = type === 'bounty';

  const isBeforeDeadline = dayjs().isBefore(dayjs(deadline));

  const targetDate =
    isWinnersAnnounced && winnersAnnouncedAt ? winnersAnnouncedAt : deadline;

  const formattedDeadline = timeAgoShort(targetDate!);

  let deadlineText;

  if (isBeforeDeadline) {
    deadlineText = `Due in ${formattedDeadline}`;
  } else {
    deadlineText = isWinnersAnnounced
      ? `Completed ${formattedDeadline} ago`
      : `Expired ${formattedDeadline} ago`;
  }

  const sponsorLogo = sponsor?.logo
    ? sponsor.logo.replace('/upload/', '/upload/c_scale,w_128,h_128,f_auto/')
    : `${router.basePath}/assets/logo/sponsor-logo.png`;

  const tokenIcon = tokenList.find((ele) => ele.tokenSymbol === token)?.icon;

  return (
    <Box
      as={NextLink}
      w="full"
      px={{ base: 2, sm: 4 }}
      py={4}
      bg={isFeatured && isBeforeDeadline ? '#FAF5FF' : 'white'}
      borderRadius={5}
      _hover={{ textDecoration: 'none', bg: 'gray.100' }}
      href={`/listings/${type}/${slug}`}
    >
      <Flex
        align="center"
        justify="space-between"
        w={{ base: '100%', md: 'brand.120' }}
      >
        <Flex w="100%">
          <Image
            w={{ base: 14, sm: 16 }}
            h={{ base: 14, sm: 16 }}
            mr={{ base: 3, sm: 5 }}
            alt={sponsor?.name}
            rounded={5}
            src={sponsorLogo}
          />
          <Flex justify="space-between" direction="column" w="full">
            <Text
              color="brand.slate.700"
              fontSize={['sm', 'sm', 'md', 'md']}
              fontWeight={600}
              _hover={{ textDecoration: 'underline' }}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </Text>
            <Flex align={'center'} gap={1} w="min-content">
              <Text
                w="full"
                color="brand.slate.500"
                fontSize={{ md: 'sm', base: 'xs' }}
                whiteSpace={'nowrap'}
              >
                {sponsor?.name}
              </Text>
              <div>{!!sponsor?.isVerified && <VerifiedBadge />}</div>
            </Flex>
            <Flex align="center" gap={{ base: 1, sm: 3 }} mt="1px">
              <>
                <Flex
                  align="center"
                  justify="start"
                  display={{ base: 'flex', sm: 'none' }}
                >
                  {compensationType !== 'variable' && (
                    <Image
                      w={3.5}
                      h={3.5}
                      mr={0.5}
                      alt={token}
                      rounded="full"
                      src={tokenIcon}
                    />
                  )}
                  <Flex align="baseline">
                    <CompensationAmount
                      compensationType={compensationType}
                      maxRewardAsk={maxRewardAsk}
                      minRewardAsk={minRewardAsk}
                      rewardAmount={rewardAmount}
                      className="whitespace-nowrap text-xs font-semibold text-slate-600 md:text-base"
                    />
                    {compensationType !== 'variable' && (
                      <Text color="gray.400" fontSize="xs" fontWeight={500}>
                        {token}
                      </Text>
                    )}
                  </Flex>
                  <Text ml={1} color="brand.slate.300" fontSize="xx-small">
                    |
                  </Text>
                </Flex>
                <Image
                  display="flex"
                  h={{ base: 3, sm: 4 }}
                  ml={isBounty ? -0.5 : 0}
                  alt={type}
                  src={getListingIcon(type!)}
                />
                <Text
                  display={{ base: 'none', sm: 'flex' }}
                  ml={{ base: -1, sm: isBounty ? '-3' : '-2.5' }}
                  color="gray.500"
                  fontSize={['x-small', 'xs', 'xs', 'xs']}
                  fontWeight={500}
                >
                  {type && type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </>
              <Text
                display="flex"
                color="brand.slate.300"
                fontSize={['xx-small', 'xs', 'sm', 'sm']}
              >
                |
              </Text>
              <Flex align="center" gap={1}>
                <Text
                  color="gray.500"
                  fontSize={['x-small', 'xs', 'xs', 'xs']}
                  whiteSpace="nowrap"
                >
                  {deadlineText}
                </Text>
              </Flex>
              <Text
                display={{ base: 'none', sm: 'flex' }}
                color="brand.slate.300"
                fontSize={['xx-small', 'xs', 'sm', 'sm']}
              >
                |
              </Text>
              {!!_count?.Comments && _count?.Comments > 0 && (
                <Flex
                  align="center"
                  gap={0.5}
                  display={{ base: 'none', sm: 'flex' }}
                  mx={{ base: 1, sm: 0 }}
                  color="gray.500"
                  fontSize={['x-small', 'xs', 'xs', 'xs']}
                >
                  <MdModeComment
                    style={{
                      color: 'var(--chakra-colors-brand-slate-500)',
                      width: '0.8rem',
                    }}
                  />
                  <Text>{_count?.Comments}</Text>
                </Flex>
              )}
              {!!isFeatured && isBeforeDeadline && (
                <Flex
                  align="center"
                  gap={1}
                  mx={{ base: 1, sm: 0 }}
                  color="#7C3AED"
                  fontSize={['x-small', 'xs', 'xs', 'xs']}
                >
                  <IoIosStar />
                  <Text
                    display={{ base: 'none', sm: 'flex' }}
                    pt={0.5}
                    fontWeight={600}
                  >
                    FEATURED
                  </Text>
                </Flex>
              )}

              {dayjs().isBefore(dayjs(deadline)) && !isWinnersAnnounced && (
                <Circle mx={{ base: 1, sm: 0 }} bg="#16A35F" size="8px" />
              )}
            </Flex>
          </Flex>
        </Flex>
        <Flex
          align="center"
          justify="start"
          display={{ base: 'none', sm: 'flex' }}
          mr={compensationType !== 'variable' ? 3 : 0}
        >
          {compensationType !== 'variable' && (
            <Image
              w={4}
              h={4}
              mt={[1, 1, 0.5, 0.5]}
              mr={1}
              alt={token}
              rounded="full"
              src={tokenIcon}
            />
          )}
          <Flex align="baseline" gap={1}>
            <CompensationAmount
              compensationType={compensationType}
              maxRewardAsk={maxRewardAsk}
              minRewardAsk={minRewardAsk}
              rewardAmount={rewardAmount}
              className="whitespace-nowrap text-xs font-semibold text-slate-600 md:text-base"
            />
            {compensationType !== 'variable' && (
              <Text
                color="gray.400"
                fontSize={['xs', 'xs', 'md', 'md']}
                fontWeight={500}
              >
                {token}
              </Text>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};

export const ListingCardMobile = ({ bounty }: { bounty: Listing }) => {
  const {
    rewardAmount,
    deadline,
    type,
    sponsor,
    title,
    token,
    slug,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
  } = bounty;
  const router = useRouter();

  const isBounty = type === 'bounty';

  return (
    <>
      <Box
        className="ph-no-capture"
        as={NextLink}
        w="full"
        px={2}
        py={4}
        borderRadius={5}
        _hover={{
          textDecoration: 'none',
          bg: 'gray.100',
        }}
        href={`/listings/${type}/${slug}`}
      >
        <Flex
          className="ph-no-capture"
          align="center"
          justify="space-between"
          w={'100%'}
        >
          <Flex w="100%">
            <Image
              w={14}
              h={14}
              mr={3}
              alt={sponsor?.name}
              rounded={5}
              src={
                sponsor?.logo
                  ? sponsor.logo.replace(
                      '/upload/',
                      '/upload/c_scale,w_128,h_128,f_auto/',
                    )
                  : `${router.basePath}/assets/logo/sponsor-logo.png`
              }
            />
            <Flex justify={'space-between'} direction={'column'} w={'full'}>
              <Text
                className="ph-no-capture"
                color="brand.slate.700"
                fontSize={'sm'}
                fontWeight={600}
                _hover={{
                  textDecoration: 'underline',
                }}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </Text>
              <Flex align={'center'} gap={1} w="min-content">
                <Text
                  w="full"
                  color="brand.slate.500"
                  fontSize={{ base: 'xs' }}
                  whiteSpace={'nowrap'}
                >
                  {sponsor?.name}
                </Text>
                <div>{!!sponsor?.isVerified && <VerifiedBadge />}</div>
              </Flex>
              <Flex align={'center'} wrap={'wrap'} gap={1} mt={'1px'}>
                <>
                  <Flex align={'center'} justify="start" display={'flex'}>
                    {compensationType !== 'variable' && (
                      <Image
                        w={3.5}
                        h={3.5}
                        mr={0.5}
                        alt={token}
                        rounded="full"
                        src={
                          tokenList.find((ele) => {
                            return ele.tokenSymbol === token;
                          })?.icon
                        }
                      />
                    )}
                    <Flex align="baseline">
                      <CompensationAmount
                        compensationType={compensationType}
                        maxRewardAsk={maxRewardAsk}
                        minRewardAsk={minRewardAsk}
                        rewardAmount={rewardAmount}
                        className="whitespace-nowrap text-xs font-semibold text-slate-600"
                      />
                      {compensationType !== 'variable' && (
                        <Text
                          color={'gray.400'}
                          fontSize={'xs'}
                          fontWeight={500}
                        >
                          {token}
                        </Text>
                      )}
                    </Flex>
                    <Text
                      ml={1}
                      color={'brand.slate.300'}
                      fontSize={['xx-small', 'xs', 'sm', 'sm']}
                    >
                      |
                    </Text>
                  </Flex>
                  <Image
                    display={'flex'}
                    h={3}
                    ml={isBounty ? -0.5 : 0}
                    alt={type}
                    src={getListingIcon(type!)}
                  />
                </>
                <Text
                  display={'flex'}
                  color={'brand.slate.300'}
                  fontSize={['xx-small', 'xs', 'sm', 'sm']}
                >
                  |
                </Text>

                <Flex align={'center'} gap={1}>
                  <Text
                    color={'gray.500'}
                    fontSize={'x-small'}
                    whiteSpace={'nowrap'}
                  >
                    {dayjs().isBefore(dayjs(deadline))
                      ? `Due ${dayjs(deadline).fromNow()}`
                      : `Closed ${dayjs(deadline).fromNow()}`}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </>
  );
};
