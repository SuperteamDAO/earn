import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Box,
  Circle,
  Flex,
  Image,
  Link,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import { franc } from 'franc';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { tokenList } from '@/constants';
import { dayjs } from '@/utils/dayjs';

import type { Bounty } from '../types';

export const ListingCardSkeleton = () => {
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  return (
    <Box px={isMobile ? 1 : 4} py={4} borderRadius={5}>
      <Flex align={'center'} justify={'space-between'} w="100%">
        <Flex w="100%" h={isMobile ? 14 : 16}>
          <Skeleton
            w={isMobile ? '4.2rem' : '4.6rem'}
            h={isMobile ? 14 : 16}
            mr={isMobile ? 3 : 5}
            rounded={5}
          />
          <Flex justify={'space-between'} direction={'column'} w={'full'}>
            <Skeleton w="60%" h="3.5" />
            <Skeleton
              w="130px"
              h="3"
              fontSize={{ md: 'sm', base: 'xs' }}
              noOfLines={1}
            />
            <Flex gap={2}>
              <SkeletonText
                w="56px"
                fontSize={{ md: 'sm', base: 'xs' }}
                noOfLines={1}
              />
              <Skeleton
                w="48px"
                fontSize={{ md: 'sm', base: 'xs' }}
                noOfLines={1}
              />
            </Flex>
          </Flex>
        </Flex>
        <Flex align={'center'} gap={2}>
          <SkeletonCircle size={'4'} />
          <Skeleton w="54px" h="14px" noOfLines={1} />
        </Flex>
      </Flex>
    </Box>
  );
};

const formatNumberWithSuffix = (number: number) => {
  if (isNaN(number)) return null;

  if (number < 1000) return number.toString();

  const suffixes = ['', 'K', 'M'];
  const tier = (Math.log10(number) / 3) | 0;

  if (tier === 0) return number.toString();

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;

  const formattedNumber =
    scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);

  return formattedNumber + suffix;
};

export const ListingCard = ({
  bounty,
  checkLanguage,
}: {
  bounty: Bounty;
  checkLanguage?: boolean;
}) => {
  const {
    rewardAmount,
    deadline,
    type,
    sponsor,
    title,
    token,
    slug,
    applicationType,
    isWinnersAnnounced,
    description,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
  } = bounty;
  const router = useRouter();
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  const isBounty = type === 'bounty';

  const langCode = franc(description);

  const isEnglish = description
    ? langCode === 'eng' || langCode === 'sco'
    : true;

  if (!isEnglish && checkLanguage) {
    return null;
  }

  const CompensationAmount = () => {
    switch (compensationType) {
      case 'fixed':
        return <>{rewardAmount?.toLocaleString()}</>;
      case 'range':
        return (
          <>{`${formatNumberWithSuffix(minRewardAsk!)}-${formatNumberWithSuffix(maxRewardAsk!)}`}</>
        );
      case 'variable':
        return (
          <Flex align={'center'} gap={1}>
            Send Quote
            <ArrowForwardIcon />
          </Flex>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Link
        as={NextLink}
        px={isMobile ? 1 : 4}
        py={4}
        borderRadius={5}
        _hover={{
          textDecoration: 'none',
          bg: 'gray.100',
        }}
        href={`/listings/${type}/${slug}`}
      >
        <Flex
          align="center"
          justify="space-between"
          w={{ base: '100%', md: 'brand.120' }}
        >
          <Flex w="100%" h={isMobile ? 14 : 16}>
            <Image
              w={isMobile ? 14 : 16}
              h={isMobile ? 14 : 16}
              mr={isMobile ? 3 : 5}
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
                color="brand.slate.700"
                fontSize={['xs', 'xs', 'md', 'md']}
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
              <Text
                w={'full'}
                color={'brand.slate.500'}
                fontSize={{ md: 'sm', base: 'xs' }}
              >
                {sponsor?.name}
              </Text>
              <Flex align={'center'} gap={isMobile ? 1 : 3}>
                <>
                  <Image
                    h="4"
                    ml={isBounty ? -0.5 : 0}
                    alt={type}
                    src={
                      isBounty
                        ? '/assets/icons/bolt.svg'
                        : '/assets/icons/briefcase.svg'
                    }
                  />
                  <Text
                    ml={isMobile ? '-1' : isBounty ? '-3' : '-2.5'}
                    color="gray.500"
                    fontSize={['x-small', 'xs', 'xs', 'xs']}
                    fontWeight={500}
                  >
                    {type && type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </>
                <Text
                  color={'brand.slate.300'}
                  fontSize={['xx-small', 'xs', 'sm', 'sm']}
                >
                  |
                </Text>
                <Text
                  color={'gray.500'}
                  fontSize={['x-small', 'xs', 'xs', 'xs']}
                >
                  {dayjs().isBefore(dayjs(deadline))
                    ? applicationType === 'rolling'
                      ? 'Rolling Deadline'
                      : `Closing ${dayjs(deadline).fromNow()}`
                    : `Closed ${dayjs(deadline).fromNow()}`}
                </Text>
                {dayjs().isBefore(dayjs(deadline)) && !isWinnersAnnounced && (
                  <>
                    <Text
                      color={'brand.slate.300'}
                      fontSize={['xx-small', 'xs', 'sm', 'sm']}
                    >
                      |
                    </Text>
                    <Flex align={'center'} gap={1}>
                      <Circle bg="#16A35F" size="8px" />
                      <Text
                        display={['none', 'none', 'block', 'block']}
                        color="#16A35F"
                        fontSize="12px"
                      >
                        Open
                      </Text>
                    </Flex>
                  </>
                )}
              </Flex>
            </Flex>
          </Flex>
          <Flex
            align={'center'}
            justify="start"
            mr={compensationType !== 'variable' ? 3 : 0}
          >
            {compensationType !== 'variable' && (
              <Image
                w={4}
                h={4}
                mr={1}
                alt={token}
                rounded="full"
                src={
                  tokenList.find((ele) => {
                    return ele.tokenSymbol === token;
                  })?.icon
                }
              />
            )}
            <Flex align="baseline" gap={1}>
              <Text
                color={'brand.slate.600'}
                fontSize={['xs', 'xs', 'md', 'md']}
                fontWeight={'600'}
                whiteSpace={'nowrap'}
              >
                <CompensationAmount />
              </Text>
              {compensationType !== 'variable' && (
                <Text
                  color={'gray.400'}
                  fontSize={['xs', 'xs', 'md', 'md']}
                  fontWeight={500}
                >
                  {token}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Link>
    </>
  );
};
